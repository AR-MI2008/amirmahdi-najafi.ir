import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { isLocale, locales, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { buildMetadata } from '@/lib/seo';
import {
  getProjectBySlug,
  getNextProject,
  getProjectSlugs,
  publishableCapabilities,
} from '@/lib/content-source';
import { breadcrumbSchema, projectSchema } from '@/lib/jsonld';
import { Breadcrumbs, ButtonLink, Container, JsonLd, Tick } from '@/components/ui/primitives';
import {
  CapabilityList,
  CaseStudySection,
  ProjectHero,
  projectVars,
} from '@/components/project/case-study';

export async function generateStaticParams() {
  const slugs = await getProjectSlugs();
  return locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
}

// Any slug outside generateStaticParams is a real 404, not a rendered shell.
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  if (!isLocale(raw)) return {};
  const locale = raw as Locale;
  const project = await getProjectBySlug(slug);
  if (!project) return {};

  return buildMetadata({
    locale,
    path: `/projects/${slug}`,
    title: `${project.name[locale]} — ${project.category[locale]}`,
    description: project.summary[locale],
    ogTitle: project.name[locale],
    ogSubtitle: project.role[locale],
    // OG images render on a dark card, so the dark accent is the correct one.
    accent: project.theme.dark.accent,
  });
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  const dict = await getDictionary(locale);
  const next = await getNextProject(slug);

  return (
    <div className="project-scope" style={projectVars(project)}>
      <JsonLd data={projectSchema(project, locale)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: dict.breadcrumb.home, path: `/${locale}` },
          { name: dict.nav.work, path: `/${locale}/projects` },
          { name: project.name[locale], path: `/${locale}/projects/${slug}` },
        ])}
      />

      <Container className="pt-8">
        <Breadcrumbs
          items={[
            { name: dict.breadcrumb.home, href: `/${locale}` },
            { name: dict.nav.work, href: `/${locale}/projects` },
            { name: project.name[locale] },
          ]}
        />
      </Container>

      <ProjectHero
        project={project}
        locale={locale}
        strings={{
          role: dict.project.role,
          date: dict.project.date,
          status: dict.project.status,
          category: dict.project.category,
        }}
      />

      {project.sections.map((section) => (
        <CaseStudySection key={section.id} section={section} locale={locale} />
      ))}

      <CapabilityList
        capabilities={publishableCapabilities(project)}
        locale={locale}
        strings={{
          title: dict.project.capabilities,
          implemented: dict.project.implemented,
          inProgress: dict.project.inProgress,
          planned: dict.project.planned,
        }}
      />

      <section className="rule py-14 md:py-20">
        <Container>
          <div className="grid gap-8 md:grid-cols-[16rem_1fr]">
            <h2 className="text-[length:var(--text-xl)] font-medium tracking-[-0.02em]">
              {dict.project.stack}
            </h2>
            <ul className="flex flex-wrap gap-2">
              {project.tech.map((item) => (
                <li
                  key={item}
                  className="rounded border border-line px-3 py-1.5 font-mono text-[length:var(--text-xs)]"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      {project.gallery.length > 0 ? (
        <section className="rule py-14 md:py-20">
          <Container>
            <ul className="grid gap-5 md:grid-cols-2">
              {project.gallery.map((image) => (
                <li key={image.src}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.src}
                    alt={image.alt[locale]}
                    width={image.width}
                    height={image.height}
                    loading="lazy"
                    decoding="async"
                    className="w-full rounded border border-line"
                  />
                </li>
              ))}
            </ul>
          </Container>
        </section>
      ) : null}

      {project.links.length > 0 ? (
        <section className="rule py-14 md:py-20">
          <Container>
            <div className="grid gap-8 md:grid-cols-[16rem_1fr]">
              <h2 className="text-[length:var(--text-xl)] font-medium tracking-[-0.02em]">
                {dict.sections.relatedLinks}
              </h2>
              <ul className="space-y-3">
                {project.links.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[length:var(--text-base)] underline decoration-[color:var(--accent)] decoration-1 underline-offset-4 hover:text-accent"
                      dir="ltr"
                    >
                      {link.label[locale]}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </Container>
        </section>
      ) : null}

      <section className="rule py-14 md:py-20">
        <Container>
          <Tick>{dict.sections.nextProject}</Tick>
          <Link
            href={`/${locale}/projects/${next.slug}`}
            className="group mt-4 flex flex-wrap items-baseline justify-between gap-4"
          >
            <span className="text-[length:var(--text-2xl)] font-medium tracking-[-0.03em] group-hover:text-accent">
              {next.name[locale]}
            </span>
            <span className="text-[length:var(--text-sm)] text-muted">
              {next.category[locale]}
            </span>
          </Link>
          <div className="mt-10">
            <ButtonLink href={`/${locale}/contact`} variant="outline">
              {dict.hero.secondary}
            </ButtonLink>
          </div>
        </Container>
      </section>
    </div>
  );
}
