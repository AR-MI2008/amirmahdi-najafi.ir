import { NextResponse } from 'next/server';
import { contactSchema, escapeHtml } from '@/lib/validation';
import { clientKey, getRateLimiter } from '@/lib/rate-limit';
import { getSiteConfig } from '@/lib/content-source';
import { features } from '@/lib/env';
import { verifyTurnstileToken } from '@/lib/turnstile-verify';

const site = getSiteConfig();

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Every failure path returns the same generic body. No field-level leakage. */
const GENERIC_ERROR = { ok: false } as const;

const MAX_BODY_BYTES = 16_000;

export async function POST(request: Request) {
  if (request.headers.get('content-type')?.includes('application/json') !== true) {
    return NextResponse.json(GENERIC_ERROR, { status: 415 });
  }

  // Reject oversized payloads before parsing.
  const declared = Number(request.headers.get('content-length') ?? '0');
  if (declared > MAX_BODY_BYTES) return NextResponse.json(GENERIC_ERROR, { status: 413 });

  const key = clientKey(request);
  const limit = await getRateLimiter().check(key);
  if (!limit.ok) {
    return NextResponse.json(GENERIC_ERROR, {
      status: 429,
      headers: { 'Retry-After': String(limit.retryAfter) },
    });
  }

  // Content-Length can lie or be absent under chunked encoding, so measure the
  // body we actually received too.
  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return NextResponse.json(GENERIC_ERROR, { status: 400 });
  }
  if (raw.length > MAX_BODY_BYTES) return NextResponse.json(GENERIC_ERROR, { status: 413 });

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json(GENERIC_ERROR, { status: 400 });
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json(GENERIC_ERROR, { status: 400 });

  const data = parsed.data;

  // Honeypot filled, or submitted faster than a human could type: accept
  // silently so the bot learns nothing, but send nothing.
  if (data.website !== '' || Date.now() - data.renderedAt < 3000) {
    return NextResponse.json({ ok: true });
  }

  /*
   * `key` above is a salted hash for rate limiting. It is deliberately NOT
   * passed to Cloudflare: remoteip means the visitor's real IP address, which
   * this application never holds, and the field is optional.
   */
  const verification = await verifyTurnstileToken(data.turnstileToken);
  if (!verification.ok) {
    // The reason stays server-side; the browser gets the same generic body as
    // every other rejection.
    console.error(`[contact] turnstile check failed: ${verification.reason}`);
    return NextResponse.json(GENERIC_ERROR, { status: 400 });
  }

  const destination = process.env.CONTACT_DESTINATION ?? site.email;
  const apiKey = process.env.EMAIL_API_KEY;
  const from = process.env.EMAIL_FROM;

  // Subject is single-line-validated upstream, so no header injection is
  // possible; the body is escaped so no user HTML is ever rendered.
  const subject = `Site enquiry — ${data.subject}`;
  const html = [
    `<p><strong>From:</strong> ${escapeHtml(data.name)} &lt;${escapeHtml(data.email)}&gt;</p>`,
    data.projectType ? `<p><strong>Type:</strong> ${escapeHtml(data.projectType)}</p>` : '',
    `<p><strong>Subject:</strong> ${escapeHtml(data.subject)}</p>`,
    `<pre style="white-space:pre-wrap;font-family:inherit">${escapeHtml(data.message)}</pre>`,
  ].join('\n');

  if (!features.mail() || !apiKey || !from) {
    /*
     * No mail provider configured.
     *
     * This previously returned { ok: true } and dropped the message. A visitor
     * saw "thanks, I'll be in touch" for a message that went nowhere — the
     * worst possible outcome for a contact form, because nobody ever finds out.
     *
     * Production can no longer reach this branch: src/lib/env.ts refuses to
     * boot without EMAIL_API_KEY and EMAIL_FROM. If it is reached anyway, the
     * visitor gets an error and can use the Telegram or email links instead.
     */
    if (process.env.NODE_ENV === 'production') {
      console.error('[contact] mail provider missing in production; returning 503');
      return NextResponse.json(GENERIC_ERROR, { status: 503 });
    }

    console.warn(
      `[contact] dev mode, no mail provider. Would send to ${destination}: ${data.subject}`,
    );
    return NextResponse.json({ ok: true, delivered: false, mode: 'development' });
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [destination],
        reply_to: data.email,
        subject,
        html,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`provider responded ${res.status}`);
  } catch {
    // Never surface provider detail or a stack trace.
    console.error('[contact] delivery failed');
    return NextResponse.json(GENERIC_ERROR, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json(GENERIC_ERROR, { status: 405, headers: { Allow: 'POST' } });
}
