import type { CSSProperties } from 'react';
import type { Locale } from '@/i18n/config';
import type { CaseSection, Capability, Project } from '@/lib/content-source';
import { projectDate } from '@/lib/content-source';
import { ProjectMotif } from './project-motif';
import { Container, Tick } from '@/components/ui/primitives';

/**
 * A project's identity is applied as scoped CSS variables.
 *
 * BOTH palettes are emitted, because an inline style cannot respond to
 * [data-theme]. The mapping from these raw values to the variables the UI
 * reads (--accent, --project-bg, --project-fg …) lives in globals.css under
 * `.project-scope`, which is keyed on the active theme.
 *
 * Always pair this with className="project-scope"; the variables do nothing
 * on their own.
 */
export function projectVars(project: Project): CSSProperties {
  const { dark, light, glow, glowLight } = project.theme;
  return {
    '--p-dark-accent': dark.accent,
    '--p-dark-accent-2': dark.accentSecondary,
    '--p-dark-bg': dark.background,
    '--p-dark-surface': dark.surface,
    '--p-dark-fg': dark.foreground,
    '--p-dark-muted': dark.muted,
    '--p-dark-glow': String(glow),
    '--p-light-accent': light.accent,
    '--p-light-accent-2': light.accentSecondary,
    '--p-light-bg': light.background,
    '--p-light-surface': light.surface,
    '--p-light-fg': light.foreground,
    '--p-light-muted': light.muted,
    '--p-light-glow': String(glowLight),
  } as CSSProperties;
}

export function ProjectHero({
  project,
  locale,
  strings,
}: {
  project: Project;
  locale: Locale;
  strings: { role: string; date: string; status: string; category: string };
}) {
  const statusLabels: Record<Project['status'], Record<Locale, string>> = {
    live: { en: 'Live', fa: 'منتشرشده' },
    'in-development': { en: 'In development', fa: 'در حال توسعه' },
    prototype: { en: 'Prototype', fa: 'نمونهٔ اولیه' },
    delivered: { en: 'Delivered', fa: 'تحویل‌شده' },
  };

  const date = projectDate(project, locale);

  return (
    <header className="project-surface relative isolate overflow-hidden border-b border-line">
      <div className="grid-substrate absolute inset-0 -z-10 opacity-70" aria-hidden="true" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[70%]"
        style={{
          background:
            'radial-gradient(60% 100% at 50% 0%, color-mix(in oklab, var(--accent) calc(var(--project-glow) * 26%), transparent), transparent)',
        }}
      />

      <Container>
        <div className="grid items-center gap-12 py-20 md:py-28 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <p className="tick" style={{ color: 'var(--accent)' }}>
              {project.category[locale]}
            </p>
            <h1 className="mt-5 text-[length:var(--text-3xl)] font-medium leading-[1.05] tracking-[-0.035em] md:text-[length:var(--text-display)] md:leading-[0.95]">
              {project.name[locale]}
            </h1>
            <p className="prose-body mt-7">{project.intro[locale]}</p>

            <dl className="mt-10 grid gap-6 sm:grid-cols-3">
              <div>
                <dt className="tick">{strings.role}</dt>
                <dd className="mt-1.5 text-[length:var(--text-sm)]">{project.role[locale]}</dd>
              </div>
              {/* An unverified date is not rendered at all — see
                  docs/CONTENT-FACT-CHECK.md. No placeholder, no guess. */}
              {date ? (
                <div>
                  <dt className="tick">{strings.date}</dt>
                  <dd className="mt-1.5 text-[length:var(--text-sm)] tabular-nums">{date}</dd>
                </div>
              ) : null}
              <div>
                <dt className="tick">{strings.status}</dt>
                <dd className="mt-1.5 text-[length:var(--text-sm)]">
                  {statusLabels[project.status][locale]}
                </dd>
              </div>
            </dl>
          </div>

          <div
            className="relative aspect-[5/4] overflow-hidden rounded-lg border border-line"
            style={{ background: 'var(--project-surface)' }}
          >
            <ProjectMotif motif={project.theme.motif} />
          </div>
        </div>
      </Container>
    </header>
  );
}

export function CaseStudySection({
  section,
  locale,
}: {
  section: CaseSection;
  locale: Locale;
}) {
  return (
    <section id={section.id} className="rule py-14 md:py-20">
      <Container>
        <div className="grid gap-8 md:grid-cols-[16rem_1fr]">
          <h2 className="text-[length:var(--text-xl)] font-medium tracking-[-0.02em]">
            {section.title[locale]}
          </h2>
          <div className="space-y-5">
            {section.body[locale].map((paragraph, i) => (
              <p key={i} className="prose-body">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

export function CapabilityList({
  capabilities,
  locale,
  strings,
}: {
  capabilities: Capability[];
  locale: Locale;
  strings: { title: string; implemented: string; inProgress: string; planned: string };
}) {
  // Defence in depth: callers already filter, but an unverified claim must not
  // be one refactor away from being published.
  const visible = capabilities.filter((c) => c.state !== 'unverified');
  if (visible.length === 0) return null;

  const label: Record<'implemented' | 'in-progress' | 'planned', string> = {
    implemented: strings.implemented,
    'in-progress': strings.inProgress,
    planned: strings.planned,
  };

  const dot: Record<'implemented' | 'in-progress' | 'planned', string> = {
    implemented: 'var(--success)',
    'in-progress': 'var(--accent)',
    planned: 'var(--muted)',
  };

  return (
    <section id="capabilities" className="rule py-14 md:py-20">
      <Container>
        <div className="grid gap-8 md:grid-cols-[16rem_1fr]">
          <h2 className="text-[length:var(--text-xl)] font-medium tracking-[-0.02em]">
            {strings.title}
          </h2>
          <ul className="space-y-3">
            {visible.map((capability) => (
              <li
                key={capability.label.en}
                className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-line pb-3"
              >
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 shrink-0 translate-y-[-1px] rounded-full"
                  style={{
                    background:
                      capability.state === 'unverified'
                        ? 'var(--muted)'
                        : dot[capability.state],
                  }}
                />
                <span className="flex-1 text-[length:var(--text-base)]">
                  {capability.label[locale]}
                </span>
                <Tick>
                  {capability.state === 'unverified' ? '' : label[capability.state]}
                </Tick>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
