'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Locale } from '@/i18n/config';
import { ThemeToggle } from './theme-toggle';
import { LanguageSwitcher } from './language-switcher';
import { cx } from '@/lib/utils';

type NavStrings = {
  work: string;
  about: string;
  blog: string;
  services: string;
  contact: string;
  menu: string;
  close: string;
  theme: string;
  language: string;
  commands: string;
};

export function Navigation({ locale, strings }: { locale: Locale; strings: NavStrings }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  const links = [
    { href: `/${locale}/projects`, label: strings.work },
    { href: `/${locale}/about`, label: strings.about },
    { href: `/${locale}/blog`, label: strings.blog },
    { href: `/${locale}/services`, label: strings.services },
    { href: `/${locale}/contact`, label: strings.contact },
  ];

  return (
    <header
      className={cx(
        'sticky top-0 z-50 border-b transition-colors duration-[var(--dur-normal)]',
        scrolled ? 'border-line bg-[color:var(--bg)]/85 backdrop-blur-md' : 'border-transparent',
      )}
    >
      <div className="shell flex h-16 items-center justify-between gap-4">
        <Link
          href={`/${locale}`}
          className="flex items-center gap-2.5 font-medium tracking-[-0.01em]"
          aria-label={locale === 'fa' ? 'امیرمهدی نجفی — خانه' : 'Amirmahdi Najafi — home'}
        >
          <span
            aria-hidden="true"
            className="grid h-8 w-8 place-items-center rounded-sm border border-line font-mono text-[0.7rem] tracking-[0.04em] text-accent"
          >
            AN
          </span>
          <span className="hidden text-[length:var(--text-sm)] sm:inline">
            {locale === 'fa' ? 'امیرمهدی نجفی' : 'Amirmahdi Najafi'}
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {links.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={cx(
                  'rounded px-3 py-2 text-[length:var(--text-sm)] transition-colors duration-[var(--dur-fast)]',
                  active ? 'text-fg' : 'text-muted hover:text-fg',
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event('palette:open'))}
            aria-label={strings.commands}
            className="hidden h-9 items-center gap-2 rounded border border-line px-3 tick transition-colors duration-[var(--dur-fast)] hover:border-[color:var(--border-strong)] hover:text-fg lg:flex"
          >
            <span aria-hidden="true">⌘</span>K
          </button>
          <LanguageSwitcher locale={locale} label={strings.language} />
          <ThemeToggle label={strings.theme} />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? strings.close : strings.menu}
            className="grid h-9 w-9 place-items-center rounded border border-line text-muted md:hidden"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
              <path
                d={open ? 'M5 5l10 10M15 5L5 15' : 'M3 6h14M3 14h14'}
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </button>
        </div>
      </div>

      {open ? (
        <nav id="mobile-nav" aria-label="Primary" className="border-t border-line md:hidden">
          <ul className="shell py-2">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block border-b border-line py-4 text-[length:var(--text-lg)] last:border-b-0"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
