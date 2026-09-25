import dynamic from 'next/dynamic';
import type { Locale } from '@/i18n/config';
import { getSiteConfig } from '@/lib/content-source';

const site = getSiteConfig();
import { ButtonLink, Container } from '@/components/ui/primitives';

// Deferred so the hero's text is never behind a JS download.
const HeroField = dynamic(() => import('./hero-field').then((m) => m.HeroField));

type Strings = {
  name: string;
  lines: string[];
  lede: string;
  primary: string;
  secondary: string;
};

export function Hero({ locale, strings }: { locale: Locale; strings: Strings }) {
  return (
    <section className="relative isolate overflow-hidden grain" aria-labelledby="hero-heading">
      <div className="grid-substrate absolute inset-0 -z-10" aria-hidden="true" />
      <HeroField />

      <Container className="relative">
        <div className="flex min-h-[calc(100svh-4rem)] flex-col justify-center py-20">
          <p className="reveal tick" data-step="1">
            {strings.name}
          </p>

          <h1
            id="hero-heading"
            className="reveal mt-6 text-[length:var(--text-display)] font-medium leading-[0.98] tracking-[-0.035em]"
            data-step="2"
          >
            {strings.lines.map((line, i) => (
              <span key={line} className="block" style={{ opacity: 1 - i * 0.12 }}>
                {line}
              </span>
            ))}
          </h1>

          <p
            className="reveal mt-8 max-w-[46ch] text-[length:var(--text-lg)] leading-relaxed text-muted"
            data-step="3"
          >
            {strings.lede}
          </p>

          <div className="reveal mt-10 flex flex-wrap items-center gap-3" data-step="4">
            <ButtonLink href={`/${locale}/projects`}>{strings.primary}</ButtonLink>
            <ButtonLink href={`/${locale}/contact`} variant="outline">
              {strings.secondary}
            </ButtonLink>
            {site.availability.open ? (
              <span className="ms-2 inline-flex items-center gap-2 tick">
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 rounded-full bg-[color:var(--success)]"
                />
                {site.availability.label[locale]}
              </span>
            ) : null}
          </div>
        </div>
      </Container>
    </section>
  );
}
