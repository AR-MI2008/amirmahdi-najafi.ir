import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { buildMetadata } from '@/lib/seo';
import { getServices } from '@/lib/content-source';
import { Breadcrumbs, ButtonLink, Container, JsonLd } from '@/components/ui/primitives';
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
    path: '/services',
    title: locale === 'en' ? 'Services' : 'خدمات',
    description:
      locale === 'en'
        ? 'Custom web development, full-stack applications, AI integrations, automation, backend engineering and product prototyping.'
        : 'توسعهٔ وب اختصاصی، اپلیکیشن فول‌استک، یکپارچه‌سازی هوش مصنوعی، اتوماسیون، مهندسی بک‌اند و ساخت نمونهٔ اولیهٔ محصول.',
  });
}

export default async function ServicesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const dict = await getDictionary(locale);
  const services = await getServices();

  return (
    <Container className="py-16 md:py-24">
      <JsonLd
        data={breadcrumbSchema([
          { name: dict.breadcrumb.home, path: `/${locale}` },
          { name: dict.nav.services, path: `/${locale}/services` },
        ])}
      />
      <Breadcrumbs
        items={[{ name: dict.breadcrumb.home, href: `/${locale}` }, { name: dict.nav.services }]}
      />

      <h1 className="text-[length:var(--text-3xl)] font-medium tracking-[-0.03em]">
        {dict.nav.services}
      </h1>
      <p className="prose-body mt-4">
        {locale === 'en'
          ? 'Scope, timeline and cost are agreed per project. Nothing here is priced on a page, because nothing here is the same twice.'
          : 'دامنه، زمان‌بندی و هزینه برای هر پروژه جداگانه توافق می‌شود. اینجا قیمتی درج نشده، چون هیچ پروژه‌ای دو بار مثل هم نیست.'}
      </p>

      <ul className="mt-14 divide-y divide-[color:var(--border)] border-y border-line">
        {services.map((service) => (
          <li key={service.id} className="grid gap-6 py-10 md:grid-cols-[18rem_1fr]">
            <h2 className="text-[length:var(--text-xl)] font-medium tracking-[-0.02em]">
              {service.title[locale]}
            </h2>
            <div>
              <p className="prose-body">{service.body[locale]}</p>
              <ul className="mt-5 flex flex-wrap gap-2">
                {service.includes[locale].map((item) => (
                  <li
                    key={item}
                    className="rounded border border-line px-3 py-1.5 text-[length:var(--text-xs)] text-muted"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-14">
        <ButtonLink href={`/${locale}/contact`}>
          {locale === 'en' ? 'Discuss a project' : 'گفت‌وگو دربارهٔ پروژه'}
        </ButtonLink>
      </div>
    </Container>
  );
}
