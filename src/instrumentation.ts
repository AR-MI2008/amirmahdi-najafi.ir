/**
 * Runs once when the server starts, before the first request is handled.
 *
 * Validating configuration here means a misconfigured production deploy fails
 * at boot with a readable list of problems, instead of failing silently on
 * whichever request first happens to need the missing value.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  const { serverEnv } = await import('@/lib/env');
  serverEnv();
}
