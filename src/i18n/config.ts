export const locales = ['en', 'fa'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export const localeMeta: Record<Locale, { dir: 'ltr' | 'rtl'; label: string; htmlLang: string }> = {
  en: { dir: 'ltr', label: 'English', htmlLang: 'en' },
  fa: { dir: 'rtl', label: 'فارسی', htmlLang: 'fa-IR' },
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/** Localized value pair. Every piece of site content carries both languages. */
export type L10n<T = string> = Record<Locale, T>;

export function pick<T>(value: L10n<T>, locale: Locale): T {
  return value[locale];
}

/**
 * Swap the locale segment of a path while keeping the same logical page.
 * /en/projects/pad-system -> /fa/projects/pad-system
 */
export function switchLocalePath(pathname: string, next: Locale): string {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return `/${next}`;
  if (isLocale(segments[0] as string)) segments[0] = next;
  else segments.unshift(next);
  return `/${segments.join('/')}`;
}

/** Persian digits for prose contexts. Never applied to code or URLs. */
export function localizeDigits(input: string, locale: Locale): string {
  if (locale !== 'fa') return input;
  const fa = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return input.replace(/\d/g, (d) => fa[Number(d)] as string);
}
