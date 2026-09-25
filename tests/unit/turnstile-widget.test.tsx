// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRef } from 'react';
import { act, cleanup, render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Turnstile, type TurnstileHandle } from '@/components/turnstile';
import { ContactForm } from '@/components/contact-form';

/**
 * The regression this file exists for:
 *
 * A Turnstile token is single-use. The form used to drop the token from React
 * state after a submission but never reset the widget, so the widget still
 * looked solved, the form held no token, and the submit button stayed disabled
 * until the visitor reloaded the entire page.
 */

type RenderOptions = {
  callback: (token: string) => void;
  'error-callback': () => void;
  'expired-callback': () => void;
};

/** A stand-in for the Cloudflare script, so no network is involved. */
function installTurnstileStub() {
  let nextToken = 1;
  const state = {
    rendered: 0,
    resets: 0,
    removes: 0,
    options: null as RenderOptions | null,
    /** Simulates Cloudflare solving the challenge. */
    solve() {
      act(() => state.options?.callback(`token-${nextToken++}`));
    },
    fail() {
      act(() => state.options?.['error-callback']());
    },
  };

  window.turnstile = {
    render: (_el: HTMLElement, options: RenderOptions) => {
      state.rendered += 1;
      state.options = options;
      return `widget-${state.rendered}`;
    },
    // Cloudflare clears the solved state and re-issues a challenge.
    reset: () => {
      state.resets += 1;
    },
    remove: () => {
      state.removes += 1;
    },
  } as unknown as Window['turnstile'];

  return state;
}

const STRINGS = {
  name: 'Name',
  email: 'Email',
  subject: 'Subject',
  type: 'Type',
  message: 'Message',
  typeOptions: ['Web app'],
  send: 'Send',
  sending: 'Sending',
  success: 'Message sent',
  error: 'Something went wrong',
  turnstileLabel: 'Human verification',
  turnstileFailed: 'Verification could not load',
  turnstilePending: 'Complete the verification above to send',
};

function fillForm() {
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Test Person' } });
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
  fireEvent.change(screen.getByLabelText('Subject'), { target: { value: 'Hello there' } });
  fireEvent.change(screen.getByLabelText('Message'), {
    target: { value: 'A message comfortably past the twenty character minimum.' },
  });
}

let turnstile: ReturnType<typeof installTurnstileStub>;

beforeEach(() => {
  turnstile = installTurnstileStub();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  delete window.turnstile;
});

describe('Turnstile imperative handle', () => {
  it('exposes reset() and forwards it to the Cloudflare widget', async () => {
    const ref = createRef<TurnstileHandle>();
    const onToken = vi.fn();

    render(
      <Turnstile
        ref={ref}
        siteKey="site"
        locale="en"
        onToken={onToken}
        labels={{ label: 'Human verification', failed: 'failed' }}
      />,
    );

    await waitFor(() => expect(turnstile.rendered).toBe(1));
    turnstile.solve();
    expect(onToken).toHaveBeenCalledWith('token-1');

    act(() => ref.current?.reset());

    expect(turnstile.resets).toBe(1);
    // The parent's token is cleared in the same step, so the two never drift.
    expect(onToken).toHaveBeenLastCalledWith(null);
  });

  it('is a no-op when no widget is mounted', () => {
    const ref = createRef<TurnstileHandle>();
    render(
      <Turnstile
        ref={ref}
        siteKey=""
        locale="en"
        onToken={vi.fn()}
        labels={{ label: 'l', failed: 'f' }}
      />,
    );
    expect(() => ref.current?.reset()).not.toThrow();
    expect(turnstile.resets).toBe(0);
  });
});

describe('contact form retry after a failed submission', () => {
  it('resets the widget and accepts a fresh token without a page reload', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: false }), { status: 502 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    render(<ContactForm strings={STRINGS} locale="en" turnstileSiteKey="site" />);
    await waitFor(() => expect(turnstile.rendered).toBe(1));

    const submit = () => screen.getByRole('button', { name: /send/i });

    // No token yet: submission is blocked and the reason is announced.
    expect(submit()).toBeDisabled();
    expect(screen.getByText(STRINGS.turnstilePending)).toBeTruthy();

    turnstile.solve();
    fillForm();
    await waitFor(() => expect(submit()).not.toBeDisabled());

    // First attempt fails at the provider.
    fireEvent.click(submit());
    await waitFor(() => expect(screen.getByText(STRINGS.error)).toBeTruthy());

    // THE REGRESSION: the spent token must be discarded AND the widget reset.
    await waitFor(() => expect(turnstile.resets).toBe(1));
    expect(submit()).toBeDisabled();

    // Cloudflare issues a replacement, and a normal retry succeeds.
    turnstile.solve();
    await waitFor(() => expect(submit()).not.toBeDisabled());

    fireEvent.click(submit());
    await waitFor(() => expect(screen.getByText(STRINGS.success)).toBeTruthy());

    const second = JSON.parse(fetchMock.mock.calls[1]![1].body as string) as {
      turnstileToken: string;
    };
    expect(second.turnstileToken).toBe('token-2');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('resets after a network error too, since the token may have been seen', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    render(<ContactForm strings={STRINGS} locale="en" turnstileSiteKey="site" />);
    await waitFor(() => expect(turnstile.rendered).toBe(1));

    turnstile.solve();
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => expect(turnstile.resets).toBe(1));
  });

  it('does not reset when the form is replaced by the success message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 })),
    );

    render(<ContactForm strings={STRINGS} locale="en" turnstileSiteKey="site" />);
    await waitFor(() => expect(turnstile.rendered).toBe(1));

    turnstile.solve();
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => expect(screen.getByText(STRINGS.success)).toBeTruthy());
    // The widget unmounted with the form; resetting it would be wasted work.
    expect(turnstile.resets).toBe(0);
  });

  it('does not loop: one attempt produces exactly one reset', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: false }), { status: 400 })),
    );

    render(<ContactForm strings={STRINGS} locale="en" turnstileSiteKey="site" />);
    await waitFor(() => expect(turnstile.rendered).toBe(1));

    turnstile.solve();
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => expect(turnstile.resets).toBe(1));
    // Give any stray effect a chance to re-fire.
    await new Promise((r) => setTimeout(r, 50));
    expect(turnstile.resets).toBe(1);
    expect(turnstile.rendered).toBe(1);
  });
});

describe('Turnstile disabled', () => {
  it('renders no widget and submits with no token', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    render(<ContactForm strings={STRINGS} locale="en" turnstileSiteKey="" />);

    expect(turnstile.rendered).toBe(0);
    expect(screen.queryByText(STRINGS.turnstilePending)).toBeNull();

    fillForm();
    const submit = screen.getByRole('button', { name: /send/i });
    expect(submit).not.toBeDisabled();

    fireEvent.click(submit);
    await waitFor(() => expect(screen.getByText(STRINGS.success)).toBeTruthy());

    const body = JSON.parse(fetchMock.mock.calls[0]![1].body as string) as Record<string, unknown>;
    expect('turnstileToken' in body).toBe(false);
  });
});
