import { describe, expect, it } from 'vitest';
import { shouldResetWidget } from '@/lib/turnstile-flow';

/**
 * The bug this encodes: a spent token was dropped from React state but the
 * widget was never reset, so it still looked solved while the submit button
 * stayed disabled. The only recovery was a full page reload.
 */

const base = {
  turnstileEnabled: true,
  tokenSent: true,
  outcome: 'failure' as const,
  formStaysMounted: true,
};

describe('shouldResetWidget', () => {
  it('resets after a failed submission so the visitor can retry', () => {
    expect(shouldResetWidget(base)).toBe(true);
  });

  it('resets after a provider failure', () => {
    expect(shouldResetWidget({ ...base, outcome: 'failure' })).toBe(true);
  });

  it('skips the reset when the form is replaced by the success message', () => {
    expect(
      shouldResetWidget({ ...base, outcome: 'success', formStaysMounted: false }),
    ).toBe(false);
  });

  it('resets after success if the form stays mounted', () => {
    expect(shouldResetWidget({ ...base, outcome: 'success', formStaysMounted: true })).toBe(true);
  });

  it('does nothing when Turnstile is disabled', () => {
    expect(shouldResetWidget({ ...base, turnstileEnabled: false })).toBe(false);
    expect(
      shouldResetWidget({ ...base, turnstileEnabled: false, outcome: 'success' }),
    ).toBe(false);
  });

  it('does nothing when no token was consumed', () => {
    expect(shouldResetWidget({ ...base, tokenSent: false })).toBe(false);
  });

  it('is a pure decision, safe to call repeatedly with no loop risk', () => {
    const first = shouldResetWidget(base);
    const second = shouldResetWidget(base);
    expect(first).toBe(second);
  });
});
