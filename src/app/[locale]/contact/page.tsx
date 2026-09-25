import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { buildMetadata } from '@/lib/seo';
import { getSiteConfig, getSocialLinks } from '@/lib/content-source';

const site = getSiteConfig();
import { ContactForm } from '@/components/contact-form';
import { publicEnv } from '@/lib/env';
import { Breadcrumbs, Container, JsonLd } from '@/components/ui/primitives';
import { breadcrumbSchema } from '@/lib/jsonld';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  if (!isLocale(raw)) return {};
  const locale = raw as Locale;
  return buildMetadata({
    locale,
    path: '/contact',
    title: locale === 'en' ? 'Contact' : 'تماس',
    description:
      locale === 'en'
        ? 'Start a conversation about a web application, an AI integration, a backend system or a prototype.'
        : 'گفت‌وگو دربارهٔ اپلیکیشن وب، یکپارچه‌سازی هوش مصنوعی، سیستم بک‌اند یا نمونهٔ اولیه را شروع کنید.',
  });
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const dict = await getDictionary(locale);

  return (
    <Container className="py-16 md:py-24">
      <JsonLd
        data={breadcrumbSchema([
          { name: dict.breadcrumb.home, path: `/${locale}` },
          { name: dict.nav.contact, path: `/${locale}/contact` },
        ])}
      />
      <Breadcrumbs
        items={[{ name: dict.breadcrumb.home, href: `/${locale}` }, { name: dict.nav.contact }]}
      />

      <div className="grid gap-16 lg:grid-cols-[1fr_20rem]">
        <div>
          <h1 className="text-[length:var(--text-3xl)] font-medium tracking-[-0.03em]">
            {dict.contact.title}
          </h1>
          <p className="prose-body mt-4">{dict.contact.lede}</p>
          <div className="mt-12">
            <ContactForm
              strings={dict.contact}
              locale={locale}
              turnstileSiteKey={publicEnv.turnstileSiteKey}
            />
          </div>
        </div>

        <aside className="lg:pt-24">
          <ul className="space-y-4 border-s border-line ps-6">
            {getSocialLinks().map((link) => (
              <li key={link.id}>
                <p className="tick">{link.label}</p>
                <a
                  href={link.href}
                  target={link.href.startsWith('mailto:') ? undefined : '_blank'}
                  rel="noopener noreferrer"
                  dir="ltr"
                  className="mt-1 block break-words text-[length:var(--text-sm)] hover:text-accent"
                >
                  {link.id === 'email' ? site.email : link.href.replace('https://', '')}
                </a>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </Container>
  );
}
