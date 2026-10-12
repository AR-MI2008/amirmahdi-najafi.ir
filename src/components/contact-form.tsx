'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Turnstile, type TurnstileHandle } from '@/components/turnstile';
import { shouldResetWidget } from '@/lib/turnstile-flow';

type Strings = {
  name: string;
  email: string;
  subject: string;
  type: string;
  message: string;
  typeOptions: string[];
  send: string;
  sending: string;
  success: string;
  error: string;
  turnstileLabel: string;
  turnstileFailed: string;
  turnstilePending: string;
};

type State = 'idle' | 'sending' | 'sent' | 'error';

export function ContactForm({
  strings,
  locale,
  turnstileSiteKey,
}: {
  strings: Strings;
  locale: string;
  /** Empty string means Turnstile is not configured. The form still works. */
  turnstileSiteKey: string;
}) {
  const [state, setState] = useState<State>('idle');
  const [token, setToken] = useState<string | null>(null);
  const renderedAt = useRef(0);
  useEffect(() => {
    renderedAt.current = Date.now();
  }, []);
  const turnstileRef = useRef<TurnstileHandle>(null);

  const turnstileRequired = turnstileSiteKey.length > 0;
  const onToken = useCallback((next: string | null) => setToken(next), []);

  /**
   * Called once per submission attempt, from the async continuation of the
   * submit handler — never during render, so there is no reset/render loop.
   *
   * On success the form is replaced by the success message, so the widget is
   * unmounting and needs no reset. On any failure the spent token is discarded
   * and a fresh challenge is requested, which is what makes retry possible
   * without a page reload.
   */
  const finishAttempt = useCallback(
    (outcome: 'success' | 'failure', tokenSent: boolean) => {
      const needsReset = shouldResetWidget({
        turnstileEnabled: turnstileRequired,
        tokenSent,
        outcome,
        formStaysMounted: outcome !== 'success',
      });
      if (!needsReset) return;
      // Cleared here as well as inside reset(): if the widget never mounted,
      // reset() is a no-op and this is the only thing that discards the spent
      // token. Both set the same value, so there is nothing to race.
      setToken(null);
      turnstileRef.current?.reset();
    },
    [turnstileRequired],
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === 'sending') return;
    setState('sending');

    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = Object.fromEntries(data.entries());
    const sentToken = Boolean(token);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          renderedAt: renderedAt.current,
          ...(token ? { turnstileToken: token } : {}),
        }),
      });
      // Deliberately generic: the response never reveals which field failed
      // or whether an address exists.
      setState(res.ok ? 'sent' : 'error');
      if (res.ok) form.reset();
      finishAttempt(res.ok ? 'success' : 'failure', sentToken);
    } catch {
      setState('error');
      // The request may still have reached Cloudflare and the server, so treat
      // the token as spent.
      finishAttempt('failure', sentToken);
    }
  }

  const field =
    'w-full rounded border border-line bg-[color:var(--surface)] px-4 py-3 text-[length:var(--text-base)] text-fg outline-none transition-colors duration-[var(--dur-fast)] placeholder:text-muted focus:border-[color:var(--accent)]';

  if (state === 'sent') {
    return (
      <p
        role="status"
        className="rounded border border-[color:var(--success)] bg-[color:var(--surface)] p-6 text-[length:var(--text-base)]"
      >
        {strings.success}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5">
      {/* Honeypot: positioned off-screen, not display:none, and never focusable. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-2 block text-[length:var(--text-sm)]">
            {strings.name}
          </label>
          <input
            id="name"
            name="name"
            required
            maxLength={80}
            autoComplete="name"
            className={field}
          />
        </div>
        <div>
          <label htmlFor="email" className="mb-2 block text-[length:var(--text-sm)]">
            {strings.email}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            maxLength={160}
            autoComplete="email"
            dir="ltr"
            className={field}
          />
        </div>
      </div>

      <div>
        <label htmlFor="subject" className="mb-2 block text-[length:var(--text-sm)]">
          {strings.subject}
        </label>
        <input id="subject" name="subject" required maxLength={140} className={field} />
      </div>

      <div>
        <label htmlFor="projectType" className="mb-2 block text-[length:var(--text-sm)]">
          {strings.type}
        </label>
        <select id="projectType" name="projectType" className={field} defaultValue="">
          <option value="">—</option>
          {strings.typeOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="message" className="mb-2 block text-[length:var(--text-sm)]">
          {strings.message}
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={7}
          minLength={20}
          maxLength={4000}
          className={`${field} resize-y`}
        />
      </div>

      {turnstileRequired ? (
        <Turnstile
          ref={turnstileRef}
          siteKey={turnstileSiteKey}
          locale={locale}
          onToken={onToken}
          labels={{ label: strings.turnstileLabel, failed: strings.turnstileFailed }}
        />
      ) : null}

      {state === 'error' ? (
        <p role="alert" className="text-[length:var(--text-sm)] text-[color:var(--danger)]">
          {strings.error}
        </p>
      ) : null}

      <div>
        <button
          type="submit"
          disabled={state === 'sending' || (turnstileRequired && !token)}
          aria-describedby={turnstileRequired && !token ? 'turnstile-pending' : undefined}
          className="rounded bg-accent px-6 py-3 text-[length:var(--text-sm)] font-medium text-[color:var(--accent-contrast)] transition-[filter,transform] duration-[var(--dur-fast)] hover:brightness-110 active:scale-[0.985] disabled:opacity-60"
        >
          {state === 'sending' ? strings.sending : strings.send}
        </button>
        {turnstileRequired && !token ? (
          <p id="turnstile-pending" className="mt-2 text-[length:var(--text-sm)] text-muted">
            {strings.turnstilePending}
          </p>
        ) : null}
      </div>
    </form>
  );
}
