import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { buildMetadata } from '@/lib/seo';
import { getProjects } from '@/lib/content-source';
import { ProjectCard } from '@/components/project/project-card';
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
    path: '/projects',
    title: locale === 'en' ? 'Projects' : 'پروژه‌ها',
    description:
      locale === 'en'
        ? 'Case studies for PAD System, WebGuard, Melamin Layegh, HyperNet and Arc Core — what each project had to solve and how it was built.'
        : 'مطالعات موردی پاد، وب‌گارد، ملامین لایق، هایپرنت و آرک کور — هر پروژه چه مسئله‌ای داشت و چطور ساخته شد.',
  });
}

export default async function ProjectsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const dict = await getDictionary(locale);
  const ordered = [...(await getProjects())].sort((a, b) => a.order - b.order);

  return (
    <Container className="py-16 md:py-24">
      <JsonLd
        data={breadcrumbSchema([
          { name: dict.breadcrumb.home, path: `/${locale}` },
          { name: dict.nav.work, path: `/${locale}/projects` },
        ])}
      />
      <Breadcrumbs
        items={[{ name: dict.breadcrumb.home, href: `/${locale}` }, { name: dict.nav.work }]}
      />

      <h1 className="text-[length:var(--text-3xl)] font-medium tracking-[-0.03em]">
        {dict.sections.work}
      </h1>
      <p className="prose-body mt-4">{dict.sections.workLede}</p>

      <div className="mt-14 grid gap-5 md:grid-cols-2">
        {ordered.map((project, i) => (
          <div key={project.slug} className={i === 0 ? 'md:col-span-2' : undefined}>
            <ProjectCard
              project={project}
              locale={locale}
              size={i === 0 ? 'lead' : 'default'}
              strings={{ role: dict.project.role, caseStudy: dict.sections.caseStudy }}
            />
          </div>
        ))}
      </div>
    </Container>
  );
}
