export function validAdminOrigin(h: Headers): boolean {
  try {
    const origin = h.get('origin');
    if (!origin) return false;
    const url = new URL(origin);
    const configured = process.env.ADMIN_ORIGIN;
    if (configured) {
      const trusted = new URL(configured);
      if (process.env.NODE_ENV === 'production' && trusted.protocol !== 'https:') return false;
      return url.origin === trusted.origin;
    }
    return (
      process.env.NODE_ENV !== 'production' &&
      url.protocol === 'http:' &&
      url.host === h.get('host')
    );
  } catch {
    return false;
  }
}
