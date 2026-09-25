import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import type { Project } from '@/lib/content-source';
import { projectDate } from '@/lib/content-source';
import { ProjectMotif } from './project-motif';
import { projectVars } from './case-study';

type Strings = { role: string; caseStudy: string };

/**
 * Cards are deliberately not uniform: the first is full-width, the rest sit in
 * a two-column grid, and each carries its own accent and motif so a visitor
 * reads five identities rather than five instances of one component.
 */
export function ProjectCard({
  project,
  locale,
  strings,
  size = 'default',
}: {
  project: Project;
  locale: Locale;
  strings: Strings;
  size?: 'default' | 'lead';
}) {
  const date = projectDate(project, locale);

  return (
    <Link
      href={`/${locale}/projects/${project.slug}`}
      style={projectVars(project)}
      className="project-scope group relative isolate flex flex-col overflow-hidden rounded-lg border border-line bg-[color:var(--surface)] transition-[border-color,transform] duration-[var(--dur-normal)] ease-out hover:border-[color:var(--accent)] motion-safe:hover:-translate-y-0.5"
    >
      <div
        className={`project-surface relative overflow-hidden border-b border-line ${size === 'lead' ? 'aspect-[21/9]' : 'aspect-[16/10]'}`}
      >
        <ProjectMotif motif={project.theme.motif} />
        <span
          aria-hidden="true"
          className="absolute inset-0 opacity-0 transition-opacity duration-[var(--dur-slow)] group-hover:opacity-100"
          style={{
            background: `radial-gradient(60% 70% at 50% 100%, color-mix(in oklab, var(--accent) 22%, transparent), transparent)`,
          }}
        />
      </div>

      <div className="flex flex-1 flex-col gap-3 p-6">
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="text-[length:var(--text-xl)] font-medium tracking-[-0.02em]">
            {project.name[locale]}
          </h3>
          {date ? <span className="tick shrink-0">{date}</span> : null}
        </div>

        <p className="text-[length:var(--text-sm)] text-muted" style={{ color: 'var(--accent)' }}>
          {project.category[locale]}
        </p>

        <p className="text-[length:var(--text-sm)] leading-relaxed text-muted">
          {project.summary[locale]}
        </p>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
          <span className="tick">
            {strings.role}: {project.role[locale]}
          </span>
          <span className="text-[length:var(--text-sm)] font-medium text-fg underline decoration-[color:var(--accent)] decoration-2 underline-offset-4">
            {strings.caseStudy}
          </span>
        </div>
      </div>
    </Link>
  );
}
