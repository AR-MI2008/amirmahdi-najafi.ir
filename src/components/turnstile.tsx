'use client';

import { useCallback, useEffect, useId, useImperativeHandle, useRef, useState } from 'react';
import type { Ref } from 'react';
import { TURNSTILE_ACTION } from '@/lib/turnstile-flow';

/**
 * Cloudflare Turnstile, rendered explicitly.
 *
 * Explicit rather than implicit rendering because implicit mode scans the DOM
 * on script load, which races React hydration and silently produces no widget
 * about one time in ten.
 *
 * When no site key is configured this component renders nothing and reports a
 * null token — the contact form then works exactly as it did before Turnstile
 * existed. The server only demands a token when the secret is set, and env
 * validation refuses to boot if only one half of the pair is present.
 *
 * Turnstile tokens are SINGLE USE. Once a token has been sent to the server it
 * is spent, whatever the outcome. The parent must therefore be able to reset
 * the widget imperatively after every attempt that consumed one — otherwise
 * the widget still looks solved, the parent holds no token, and the submit
 * button stays disabled until the visitor reloads the page. That is what
 * `TurnstileHandle.reset()` is for.
 */

export type TurnstileHandle = {
  /**
   * Discards the current token and asks Cloudflare for a fresh challenge.
   * Safe to call when no widget is mounted; it is then a no-op.
   *
   * Call this from an event handler or an async continuation only. Calling it
   * during render would re-enter the token callback and loop.
   */
  reset: () => void;
};

type TurnstileApi = {
  render: (
    el: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      'error-callback': () => void;
      'expired-callback': () => void;
      'timeout-callback'?: () => void;
      theme?: 'auto' | 'light' | 'dark';
      appearance?: 'always' | 'execute' | 'interaction-only';
      language?: string;
      action?: string;
    },
  ) => string;
  remove: (widgetId: string) => void;
  reset: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
    onTurnstileLoad?: () => void;
  }
}

const SCRIPT_ID = 'cf-turnstile-script';
const SCRIPT_SRC =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onTurnstileLoad';

function loadScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.turnstile) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('turnstile script failed')));
      return;
    }
    window.onTurnstileLoad = () => resolve();
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error('turnstile script failed'));
    document.head.appendChild(script);
  });
}

export function Turnstile({
  ref,
  siteKey,
  locale,
  onToken,
  labels,
}: {
  /**
   * React 19 passes refs to function components as an ordinary prop, so no
   * forwardRef wrapper is needed.
   */
  ref?: Ref<TurnstileHandle>;
  siteKey: string;
  locale: string;
  /** Called with a token, or null when the token is absent, expired or failed. */
  onToken: (token: string | null) => void;
  labels: { label: string; failed: string };
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  const [failed, setFailed] = useState(false);
  const describedBy = useId();

  // Keep the latest callback without re-rendering the widget on every parent
  // render — re-rendering a Turnstile widget invalidates its token.
  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  const reset = useCallback(() => {
    const api = typeof window === 'undefined' ? undefined : window.turnstile;
    if (!api || !widgetRef.current) return;
    // Clearing the parent's token first keeps the two in step even if
    // Cloudflare never issues a replacement.
    onTokenRef.current(null);
    setFailed(false);
    api.reset(widgetRef.current);
  }, []);

  useImperativeHandle(ref, () => ({ reset }), [reset]);

  useEffect(() => {
    if (!siteKey) return;
    let cancelled = false;

    loadScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;
        widgetRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          language: locale,
          theme: 'auto',
          action: TURNSTILE_ACTION,
          callback: (token) => {
            setFailed(false);
            onTokenRef.current(token);
          },
          'error-callback': () => {
            setFailed(true);
            onTokenRef.current(null);
          },
          'expired-callback': () => onTokenRef.current(null),
          'timeout-callback': () => onTokenRef.current(null),
        });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      const api = window.turnstile;
      if (api && widgetRef.current) api.remove(widgetRef.current);
      widgetRef.current = null;
    };
  }, [siteKey, locale]);

  if (!siteKey) return null;

  return (
    <div>
      {/* The widget is an interactive control, so it is labelled rather than
          hidden from assistive technology. Turnstile provides its own
          accessible fallback challenge when it cannot verify passively. */}
      <div
        ref={containerRef}
        role="group"
        aria-label={labels.label}
        aria-describedby={failed ? describedBy : undefined}
        className="min-h-[65px]"
      />
      {failed ? (
        <p id={describedBy} role="alert" className="mt-2 text-[length:var(--text-sm)] text-muted">
          {labels.failed}
        </p>
      ) : null}
    </div>
  );
}
