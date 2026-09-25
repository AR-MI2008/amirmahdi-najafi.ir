import type { Metadata } from 'next';
import Link from 'next/link';
import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { buildMetadata } from '@/lib/seo';
import { getSiteConfig, getFeaturedProjects } from '@/lib/content-source';

const site = getSiteConfig();
import { Hero } from '@/components/home/hero';
import {
  ContactCta,
  Flagship,
  GitHubSection,
  Metrics,
  StackSection,
  WhatIBuild,
  Writing,
} from '@/components/home/sections';
import { ProjectCard } from '@/components/project/project-card';
import { Section } from '@/components/ui/primitives';
import { notFound } from 'next/navigation';

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
    path: '/',
    title:
      locale === 'en'
        ? 'Amirmahdi Najafi — Software Developer, AI Builder & Founder'
        : 'امیرمهدی نجفی — برنامه‌نویس، سازندهٔ محصولات هوش مصنوعی و بنیان‌گذار',
    description: site.bio[locale],
    ogSubtitle: site.headline[locale],
  });
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const dict = await getDictionary(locale);
  const projects = await getFeaturedProjects();
  const [lead, ...rest] = projects;

  return (
    <>
      <Hero locale={locale} strings={dict.hero} />

      <Section
        id="work"
        title={dict.sections.work}
        lede={dict.sections.workLede}
        action={
          <Link
            href={`/${locale}/projects`}
            className="text-[length:var(--text-sm)] text-muted hover:text-fg"
          >
            {dict.sections.viewAll}
          </Link>
        }
      >
        <div className="grid gap-5">
          {lead ? (
            <ProjectCard
              project={lead}
              locale={locale}
              size="lead"
              strings={{ role: dict.project.role, caseStudy: dict.sections.caseStudy }}
            />
          ) : null}
          <div className="grid gap-5 md:grid-cols-2">
            {rest.map((project) => (
              <ProjectCard
                key={project.slug}
                project={project}
                locale={locale}
                strings={{ role: dict.project.role, caseStudy: dict.sections.caseStudy }}
              />
            ))}
          </div>
        </div>
      </Section>

      <WhatIBuild locale={locale} title={dict.sections.build} lede={dict.sections.buildLede} />
      <Flagship locale={locale} label={dict.sections.flagship} cta={dict.sections.caseStudy} />
      <StackSection locale={locale} title={dict.sections.stack} lede={dict.sections.stackLede} />
      <Metrics locale={locale} title={dict.sections.metrics} />
      <GitHubSection locale={locale} title={dict.sections.github} lede={dict.sections.githubLede} />
      <Writing
        locale={locale}
        title={dict.sections.writing}
        lede={dict.sections.writingLede}
        viewAll={dict.sections.viewAll}
        readingLabel={dict.blog.readingTime}
      />
      <ContactCta
        locale={locale}
        title={dict.sections.cta}
        lede={dict.sections.ctaLede}
        primary={dict.hero.secondary}
      />
    </>
  );
}
