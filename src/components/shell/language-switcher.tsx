'use client';

import { usePathname } from 'next/navigation';
import { switchLocalePath, type Locale } from '@/i18n/config';

export function LanguageSwitcher({ locale, label }: { locale: Locale; label: string }) {
  const pathname = usePathname();
  const next: Locale = locale === 'en' ? 'fa' : 'en';

  return (
    <a
      href={switchLocalePath(pathname, next)}
      aria-label={label}
      title={label}
      lang={next}
      className="inline-flex h-9 items-center rounded border border-line px-3 text-[length:var(--text-sm)] text-muted transition-colors duration-[var(--dur-fast)] hover:border-[color:var(--border-strong)] hover:text-fg"
    >
      {next === 'fa' ? 'فا' : 'EN'}
    </a>
  );
}
