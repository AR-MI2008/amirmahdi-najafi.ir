'use client';

import { usePathname, useRouter } from 'next/navigation';
import { switchLocalePath, type Locale } from '@/i18n/config';

export function LanguageSwitcher({ locale, label }: { locale: Locale; label: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const next: Locale = locale === 'en' ? 'fa' : 'en';

  return (
    <button
      type="button"
      onClick={() => router.push(switchLocalePath(pathname, next))}
      aria-label={label}
      title={label}
      lang={next}
      className="h-9 rounded border border-line px-3 text-[length:var(--text-sm)] text-muted transition-colors duration-[var(--dur-fast)] hover:border-[color:var(--border-strong)] hover:text-fg"
    >
      {next === 'fa' ? 'فا' : 'EN'}
    </button>
  );
}
