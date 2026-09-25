import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import { getSiteConfig, getSocialLinks } from '@/lib/content-source';

const site = getSiteConfig();
import { Container } from '@/components/ui/primitives';

type Strings = {
  descriptor: string;
  built: string;
  rights: string;
  nav: { work: string; about: string; blog: string; services: string; contact: string };
};

export function Footer({ locale, strings }: { locale: Locale; strings: Strings }) {
  const year = new Date().getFullYear();
  const links = [
    { href: `/${locale}/projects`, label: strings.nav.work },
    { href: `/${locale}/about`, label: strings.nav.about },
    { href: `/${locale}/blog`, label: strings.nav.blog },
    { href: `/${locale}/services`, label: strings.nav.services },
    { href: `/${locale}/contact`, label: strings.nav.contact },
  ];

  return (
    <footer className="rule mt-8">
      <Container>
        <div className="grid gap-10 py-16 md:grid-cols-[1.4fr_1fr_1fr]">
          <div className="max-w-sm">
            <p className="text-[length:var(--text-lg)] font-medium tracking-[-0.01em]">
              {site.name[locale]}
            </p>
            <p className="mt-3 text-[length:var(--text-sm)] leading-relaxed text-muted">
              {strings.descriptor}
            </p>
          </div>

          <nav aria-label="Footer">
            <ul className="space-y-2.5">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[length:var(--text-sm)] text-muted transition-colors duration-[var(--dur-fast)] hover:text-fg"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <ul className="space-y-2.5">
            {getSocialLinks().map((link) => (
              <li key={link.id}>
                <a
                  href={link.href}
                  target={link.href.startsWith('mailto:') ? undefined : '_blank'}
                  rel="noopener noreferrer"
                  className="text-[length:var(--text-sm)] text-muted transition-colors duration-[var(--dur-fast)] hover:text-fg"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line py-6 tick">
          <span>
            © {year} {site.name[locale]}. {strings.rights}
          </span>
          <span>{strings.built}</span>
        </div>
      </Container>
    </footer>
  );
}
