import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { locales, isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { Navigation } from '@/components/shell/navigation';
import { Footer } from '@/components/shell/footer';
import { SkipLink } from '@/components/shell/skip-link';
import { CommandPalette, type PaletteItem } from '@/components/shell/command-palette';
import { JsonLd } from '@/components/ui/primitives';
import { personSchema, websiteSchema } from '@/lib/jsonld';
import { getProjects, getPosts, getSiteConfig } from '@/lib/content-source';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

// A malformed locale (/de, /xx, /en-US) is a real 404, not a page rendered
// with a broken dictionary. The notFound() below is the second guard.
export const dynamicParams = false;

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const dict = await getDictionary(locale);
  const site = getSiteConfig();
  const projects = await getProjects();
  const posts = await getPosts();

  const paletteItems: PaletteItem[] = [
    { id: 'home', label: dict.breadcrumb.home, group: dict.palette.pages, href: `/${locale}` },
    { id: 'work', label: dict.nav.work, group: dict.palette.pages, href: `/${locale}/projects` },
    { id: 'about', label: dict.nav.about, group: dict.palette.pages, href: `/${locale}/about` },
    { id: 'services', label: dict.nav.services, group: dict.palette.pages, href: `/${locale}/services` },
    { id: 'blog', label: dict.nav.blog, group: dict.palette.pages, href: `/${locale}/blog` },
    { id: 'contact', label: dict.nav.contact, group: dict.palette.pages, href: `/${locale}/contact` },
    ...projects.map((project) => ({
      id: `project-${project.slug}`,
      label: project.name[locale],
      group: dict.palette.projects,
      href: `/${locale}/projects/${project.slug}`,
    })),
    ...posts.map((post) => ({
      id: `post-${post.slug}`,
      label: post.title[locale],
      group: dict.palette.posts,
      href: `/${locale}/blog/${post.slug}`,
    })),
    { id: 'theme', label: dict.palette.toggleTheme, group: dict.palette.actions, action: 'theme' as const },
    {
      id: 'language',
      label: dict.palette.switchLanguage,
      group: dict.palette.actions,
      action: 'language' as const,
    },
    {
      id: 'github',
      label: dict.palette.openGithub,
      group: dict.palette.actions,
      href: site.github,
      external: true,
    },
    {
      id: 'telegram',
      label: dict.palette.openTelegram,
      group: dict.palette.actions,
      href: site.telegram,
      external: true,
    },
  ];

  return (
    <>
      <JsonLd data={personSchema(locale)} />
      <JsonLd data={websiteSchema(locale)} />
      <SkipLink label={dict.nav.skip} />
      <Navigation locale={locale} strings={dict.nav} />
      <main id="main">{children}</main>
      <Footer
        locale={locale}
        strings={{
          descriptor: dict.footer.descriptor,
          built: dict.footer.built,
          rights: dict.footer.rights,
          nav: dict.nav,
        }}
      />
      <CommandPalette locale={locale} items={paletteItems} strings={dict.palette} />
    </>
  );
}
