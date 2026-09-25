import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import {
  getCapabilities,
  getMetrics,
  getPosts,
  getProjectBySlug,
  getSiteConfig,
  getStack,
  readingTime,
} from '@/lib/content-source';
import { getRepositories } from '@/lib/github';
import { ButtonLink, Section, Tick } from '@/components/ui/primitives';
import { ProjectMotif } from '@/components/project/project-motif';
import { projectVars } from '@/components/project/case-study';

const site = getSiteConfig();
import { formatDate } from '@/lib/utils';

/* ------------------------------------------------------------- capabilities */

export async function WhatIBuild({
  locale,
  title,
  lede,
}: {
  locale: Locale;
  title: string;
  lede: string;
}) {
  const capabilities = await getCapabilities();

  return (
    <Section id="build" title={title} lede={lede}>
      <ul className="grid gap-px overflow-hidden rounded-lg border border-line bg-[color:var(--border)] sm:grid-cols-2 lg:grid-cols-3">
        {capabilities.map((item) => (
          <li key={item.id} className="bg-[color:var(--bg)] p-6">
            <h3 className="text-[length:var(--text-base)] font-medium">{item.title[locale]}</h3>
            <p className="mt-2 text-[length:var(--text-sm)] leading-relaxed text-muted">
              {item.body[locale]}
            </p>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/* ---------------------------------------------------------------- flagship */

export async function Flagship({
  locale,
  label,
  cta,
}: {
  locale: Locale;
  label: string;
  cta: string;
}) {
  const pad = await getProjectBySlug('pad-system');
  if (!pad) return null;

  return (
    <Section
      id="flagship"
      className="project-scope relative overflow-hidden"
      style={projectVars(pad)}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.35]"
        style={{
          background:
            'radial-gradient(70% 60% at 20% 0%, color-mix(in oklab, var(--accent) calc(var(--project-glow) * 26%), transparent), transparent)',
        }}
      />
      <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <Tick>{label}</Tick>
          <h2 className="mt-4 text-[length:var(--text-3xl)] font-medium tracking-[-0.03em]">
            {pad.name[locale]}
          </h2>
          <p className="mt-3 text-[length:var(--text-base)]" style={{ color: 'var(--accent)' }}>
            {pad.role[locale]}
          </p>
          <p className="prose-body mt-6">{pad.intro[locale]}</p>
          <div className="mt-8">
            <ButtonLink href={`/${locale}/projects/pad-system`} variant="outline">
              {cta}
            </ButtonLink>
          </div>
        </div>

        <div className="project-surface relative aspect-[4/3] overflow-hidden rounded-lg border border-line">
          <ProjectMotif motif="radar" />
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------- stack */

export async function StackSection({
  locale,
  title,
  lede,
}: {
  locale: Locale;
  title: string;
  lede: string;
}) {
  const stack = await getStack();

  return (
    <Section id="stack" title={title} lede={lede}>
      <dl className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
        {stack.map((group) => (
          <div key={group.group.en}>
            <dt className="tick pb-3">{group.group[locale]}</dt>
            <dd>
              <ul className="space-y-1.5">
                {group.items.map((item) => (
                  <li key={item} className="text-[length:var(--text-sm)]">
                    {item}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}

/* ----------------------------------------------------------------- metrics */

export async function Metrics({ locale, title }: { locale: Locale; title: string }) {
  const metrics = await getMetrics();
  // Fewer than two verified numbers is not a section. Zero is the current,
  // deliberate state — see docs/CONTENT-FACT-CHECK.md.
  if (metrics.length < 2) return null;

  return (
    <Section id="metrics" title={title}>
      <dl className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.slice(0, 5).map((metric) => (
          <div key={metric.id} className="border-s-2 border-accent ps-5">
            <dt className="sr-only">{metric.label[locale]}</dt>
            <dd>
              <span className="block text-[length:var(--text-3xl)] font-medium tabular-nums tracking-[-0.03em]">
                {metric.value}
              </span>
              <span className="mt-2 block text-[length:var(--text-sm)] text-muted">
                {metric.label[locale]}
              </span>
              {metric.note ? <span className="mt-1 block tick">{metric.note[locale]}</span> : null}
            </dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}

/* ------------------------------------------------------------------ github */

export async function GitHubSection({
  title,
  lede,
  locale,
}: {
  title: string;
  lede: string;
  locale: Locale;
}) {
  const repos = await getRepositories();
  // API unavailable or rate limited: render nothing rather than an error.
  if (repos.length === 0) return null;

  return (
    <Section
      id="github"
      title={title}
      lede={lede}
      action={
        <a
          href={site.github}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[length:var(--text-sm)] text-muted hover:text-fg"
        >
          {site.githubUser}
        </a>
      }
    >
      <ul className="grid gap-4 md:grid-cols-2">
        {repos.map((repo) => (
          <li key={repo.name}>
            <a
              href={repo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded border border-line p-5 transition-colors duration-[var(--dur-fast)] hover:border-[color:var(--border-strong)]"
            >
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-mono text-[length:var(--text-sm)]">{repo.name}</span>
                {repo.stars > 0 ? <span className="tick">★ {repo.stars}</span> : null}
              </div>
              {repo.description ? (
                <p className="mt-2 text-[length:var(--text-sm)] text-muted">{repo.description}</p>
              ) : null}
              {repo.language ? <p className="mt-3 tick">{repo.language}</p> : null}
              <p className="sr-only">{formatDate(repo.updatedAt, locale)}</p>
            </a>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/* ----------------------------------------------------------------- writing */

export async function Writing({
  locale,
  title,
  lede,
  viewAll,
  readingLabel,
}: {
  locale: Locale;
  title: string;
  lede: string;
  viewAll: string;
  readingLabel: string;
}) {
  const latest = (await getPosts()).slice(0, 3);
  if (latest.length === 0) return null;

  return (
    <Section
      id="writing"
      title={title}
      lede={lede}
      action={
        <Link
          href={`/${locale}/blog`}
          className="text-[length:var(--text-sm)] text-muted hover:text-fg"
        >
          {viewAll}
        </Link>
      }
    >
      <ul className="divide-y divide-[color:var(--border)] border-y border-line">
        {latest.map((post) => (
          <li key={post.slug}>
            <Link
              href={`/${locale}/blog/${post.slug}`}
              className="group grid gap-2 py-7 transition-colors duration-[var(--dur-fast)] md:grid-cols-[1fr_auto] md:items-baseline md:gap-8"
            >
              <div>
                <h3 className="text-[length:var(--text-lg)] font-medium tracking-[-0.015em] group-hover:text-accent">
                  {post.title[locale]}
                </h3>
                <p className="mt-2 max-w-prose text-[length:var(--text-sm)] text-muted">
                  {post.excerpt[locale]}
                </p>
              </div>
              <span className="tick whitespace-nowrap">
                {formatDate(post.publishedAt, locale)} · {readingTime(post, locale)} {readingLabel}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/* --------------------------------------------------------------------- cta */

export function ContactCta({
  locale,
  title,
  lede,
  primary,
}: {
  locale: Locale;
  title: string;
  lede: string;
  primary: string;
}) {
  return (
    <Section id="contact-cta">
      <div className="max-w-2xl">
        <h2 className="text-[length:var(--text-3xl)] font-medium tracking-[-0.03em]">{title}</h2>
        <p className="prose-body mt-5">{lede}</p>
        <div className="mt-9 flex flex-wrap gap-3">
          <ButtonLink href={`/${locale}/contact`}>{primary}</ButtonLink>
          <ButtonLink href={site.telegram} variant="outline" external>
            Telegram
          </ButtonLink>
        </div>
      </div>
    </Section>
  );
}
