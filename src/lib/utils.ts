export function cx(...values: (string | false | null | undefined)[]): string {
  return values.filter(Boolean).join(' ');
}

export function formatDate(iso: string, locale: 'en' | 'fa'): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat(locale === 'fa' ? 'fa-IR' : 'en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

/**
 * Server-side fetch that never throws and never hangs a render.
 * Used for every third-party call; the section degrades instead of erroring.
 */
export async function safeFetch<T>(
  url: string,
  init: RequestInit & { next?: { revalidate: number } },
  fallback: T,
): Promise<T> {
  try {
    const res = await fetch(url, { ...init, signal: AbortSignal.timeout(4000) });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}
