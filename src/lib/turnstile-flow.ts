/**
 * The one decision in the Turnstile retry flow that is easy to get wrong, kept
 * pure so it can be tested without a DOM.
 *
 * Background: a Turnstile token is single-use. The moment it is sent to the
 * server it is spent, whether the server accepted it, rejected it, or never
 * saw it because the network failed. If the widget is not reset, it still
 * looks solved to the visitor while the form holds no token — and the submit
 * button stays disabled until they reload the page.
 */
/**
 * The action the contact widget is rendered with and the server requires.
 *
 * Lives here, not in turnstile-verify.ts, because the client component needs
 * it too and that module reads process.env and calls Cloudflare. A drifted
 * literal would mean every submission failing verification.
 */
export const TURNSTILE_ACTION = 'contact';

export type SubmitOutcome = 'success' | 'failure';

export function shouldResetWidget({
  turnstileEnabled,
  tokenSent,
  outcome,
  formStaysMounted,
}: {
  turnstileEnabled: boolean;
  /** Did this attempt actually carry a token to the server? */
  tokenSent: boolean;
  outcome: SubmitOutcome;
  /** False when the form is replaced by a success message. */
  formStaysMounted: boolean;
}): boolean {
  if (!turnstileEnabled) return false;
  // Nothing was consumed, so nothing needs replacing.
  if (!tokenSent) return false;
  // The form is about to be unmounted; resetting a widget that is going away
  // is wasted work and races the unmount cleanup.
  if (outcome === 'success' && !formStaysMounted) return false;
  return true;
}
