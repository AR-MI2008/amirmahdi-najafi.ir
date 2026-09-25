import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { buildMetadata } from '@/lib/seo';
import { categoryLabels, getPosts, readingTime } from '@/lib/content-source';
import { formatDate } from '@/lib/utils';
import { BlogList, type PostItem } from '@/components/blog-list';
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
    path: '/blog',
    title: locale === 'en' ? 'Engineering notes' : 'یادداشت‌های مهندسی',
    description:
      locale === 'en'
        ? 'Notes on web security, backend engineering, building for constrained networks, and the projects behind them.'
        : 'یادداشت‌هایی دربارهٔ امنیت وب، مهندسی بک‌اند، ساخت برای شبکه‌های محدود و پروژه‌های پشت آن‌ها.',
  });
}

export default async function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const dict = await getDictionary(locale);
  const all = await getPosts();

  const items: PostItem[] = all.map((post) => ({
    slug: post.slug,
    title: post.title[locale],
    excerpt: post.excerpt[locale],
    category: post.category,
    categoryLabel: categoryLabels[post.category][locale],
    date: formatDate(post.publishedAt, locale),
    readingTime: readingTime(post, locale),
    featured: post.featured,
  }));

  const usedCategories = Array.from(new Set(all.map((p) => p.category))).map((id) => ({
    id,
    label: categoryLabels[id][locale],
  }));

  return (
    <Container className="py-16 md:py-24">
      <JsonLd
        data={breadcrumbSchema([
          { name: dict.breadcrumb.home, path: `/${locale}` },
          { name: dict.nav.blog, path: `/${locale}/blog` },
        ])}
      />
      <Breadcrumbs
        items={[{ name: dict.breadcrumb.home, href: `/${locale}` }, { name: dict.nav.blog }]}
      />

      <h1 className="text-[length:var(--text-3xl)] font-medium tracking-[-0.03em]">
        {dict.sections.writing}
      </h1>
      <p className="prose-body mt-4">{dict.sections.writingLede}</p>

      <div className="mt-12">
        <BlogList
          posts={items}
          locale={locale}
          categories={usedCategories}
          strings={{
            search: dict.blog.search,
            all: dict.blog.all,
            readingTime: dict.blog.readingTime,
            empty: dict.blog.empty,
          }}
        />
      </div>
    </Container>
  );
}
