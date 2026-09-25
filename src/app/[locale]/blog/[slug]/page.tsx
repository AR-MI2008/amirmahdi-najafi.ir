import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { isLocale, locales, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { buildMetadata } from '@/lib/seo';
import {
  categoryLabels,
  getAdjacentPosts,
  getPostBySlug,
  getPostSlugs,
  readingTime,
} from '@/lib/content-source';
import { formatDate } from '@/lib/utils';
import { breadcrumbSchema, postSchema } from '@/lib/jsonld';
import { Breadcrumbs, Container, JsonLd, Tick } from '@/components/ui/primitives';

export async function generateStaticParams() {
  const slugs = await getPostSlugs();
  return locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
}

// Drafts and unknown slugs are a real 404, never a rendered shell.
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  if (!isLocale(raw)) return {};
  const locale = raw as Locale;
  const post = await getPostBySlug(slug);
  // Drafts return no metadata and 404 below — never indexable.
  if (!post) return { robots: { index: false, follow: false } };

  return buildMetadata({
    locale,
    path: `/blog/${slug}`,
    title: post.title[locale],
    description: post.excerpt[locale],
    type: 'article',
    publishedTime: post.publishedAt,
    modifiedTime: post.updatedAt ?? post.publishedAt,
    ogSubtitle: categoryLabels[post.category][locale],
  });
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const dict = await getDictionary(locale);
  const { prev, next } = await getAdjacentPosts(slug);
  const headings = post.blocks.filter((b) => b.type === 'h2');

  return (
    <Container className="py-16 md:py-24">
      <JsonLd data={postSchema(post, locale)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: dict.breadcrumb.home, path: `/${locale}` },
          { name: dict.nav.blog, path: `/${locale}/blog` },
          { name: post.title[locale], path: `/${locale}/blog/${slug}` },
        ])}
      />

      <Breadcrumbs
        items={[
          { name: dict.breadcrumb.home, href: `/${locale}` },
          { name: dict.nav.blog, href: `/${locale}/blog` },
          { name: post.title[locale] },
        ]}
      />

      <article>
        <header className="max-w-3xl">
          <Tick>{categoryLabels[post.category][locale]}</Tick>
          <h1 className="mt-4 text-[length:var(--text-3xl)] font-medium leading-[1.12] tracking-[-0.03em]">
            {post.title[locale]}
          </h1>
          <p className="mt-5 flex flex-wrap gap-x-4 gap-y-1 tick">
            <span>
              {dict.blog.published} <time dateTime={post.publishedAt}>{formatDate(post.publishedAt, locale)}</time>
            </span>
            {post.updatedAt ? (
              <span>
                {dict.blog.updated}{' '}
                <time dateTime={post.updatedAt}>{formatDate(post.updatedAt, locale)}</time>
              </span>
            ) : null}
            <span>
              {readingTime(post, locale)} {dict.blog.readingTime}
            </span>
          </p>
        </header>

        <div className="mt-14 grid gap-12 lg:grid-cols-[1fr_15rem] lg:items-start">
          <div className="max-w-prose">
            {post.blocks.map((block, i) => {
              if (block.type === 'h2') {
                const id = block.text.en
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, '-')
                  .replace(/^-|-$/g, '');
                return (
                  <h2
                    key={i}
                    id={id}
                    className="mt-12 scroll-mt-24 text-[length:var(--text-xl)] font-medium tracking-[-0.02em]"
                  >
                    {block.text[locale]}
                  </h2>
                );
              }
              if (block.type === 'p') {
                return (
                  <p key={i} className="mt-5 text-[length:var(--text-lg)] leading-[1.75] text-muted">
                    {block.text[locale]}
                  </p>
                );
              }
              if (block.type === 'note') {
                return (
                  <aside
                    key={i}
                    className="mt-8 border-s-2 border-accent bg-[color:var(--surface)] p-5 text-[length:var(--text-base)] leading-relaxed"
                  >
                    {block.text[locale]}
                  </aside>
                );
              }
              return (
                <pre
                  key={i}
                  dir="ltr"
                  className="mt-8 overflow-x-auto rounded border border-line bg-[color:var(--surface-elevated)] p-5 text-[length:var(--text-sm)] leading-relaxed"
                >
                  <code className="font-mono">{block.code}</code>
                </pre>
              );
            })}

            <ul className="mt-14 flex flex-wrap gap-2 border-t border-line pt-8">
              {post.tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded border border-line px-3 py-1.5 text-[length:var(--text-xs)] text-muted"
                >
                  {tag}
                </li>
              ))}
            </ul>
          </div>

          {headings.length > 1 ? (
            <nav aria-label={dict.blog.toc} className="lg:sticky lg:top-24">
              <p className="tick">{dict.blog.toc}</p>
              <ul className="mt-3 space-y-2 border-s border-line ps-4">
                {headings.map((heading, i) => {
                  const text = heading.type === 'h2' ? heading.text : { en: '', fa: '' };
                  const id = text.en
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-|-$/g, '');
                  return (
                    <li key={i}>
                      <a
                        href={`#${id}`}
                        className="text-[length:var(--text-sm)] text-muted hover:text-fg"
                      >
                        {text[locale]}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </nav>
          ) : null}
        </div>
      </article>

      {prev || next ? (
        <nav
          aria-label={dict.blog.related}
          className="mt-20 grid gap-4 border-t border-line pt-10 md:grid-cols-2"
        >
          {prev ? (
            <Link href={`/${locale}/blog/${prev.slug}`} className="rounded border border-line p-5 hover:border-[color:var(--border-strong)]">
              <span className="tick">{dict.blog.previous}</span>
              <span className="mt-2 block text-[length:var(--text-base)] font-medium">
                {prev.title[locale]}
              </span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              href={`/${locale}/blog/${next.slug}`}
              className="rounded border border-line p-5 text-end hover:border-[color:var(--border-strong)]"
            >
              <span className="tick">{dict.blog.next}</span>
              <span className="mt-2 block text-[length:var(--text-base)] font-medium">
                {next.title[locale]}
              </span>
            </Link>
          ) : null}
        </nav>
      ) : null}
    </Container>
  );
}
