import type { L10n } from '@/i18n/config';

/**
 * Site-level settings. These map 1:1 to the Payload `site-settings` global
 * (see payload/collections/site-settings.ts). Until Payload is wired up this
 * file is the single source of truth — edit here, redeploy.
 */

export type SocialLink = {
  id: 'github' | 'telegram' | 'email' | 'linkedin' | 'instagram';
  label: string;
  href: string;
  /** Empty href = not configured. Never rendered. */
};

export const site = {
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://amirmahdi-najafi.ir',
  name: {
    en: 'Amirmahdi Najafi',
    fa: 'امیرمهدی نجفی',
  } satisfies L10n,
  headline: {
    en: 'Software Developer, AI Builder & Founder',
    fa: 'برنامه‌نویس، سازندهٔ محصولات هوش مصنوعی و بنیان‌گذار',
  } satisfies L10n,
  bio: {
    en: 'Amirmahdi Najafi is a software developer and founder who builds web applications, backend systems and AI-driven products. He is the founder, CEO and developer of PAD System, a crisis-management platform, and builds WebGuard, an open web security posture checker.',
    fa: 'امیرمهدی نجفی برنامه‌نویس و بنیان‌گذاری است که اپلیکیشن‌های وب، سیستم‌های بک‌اند و محصولات مبتنی بر هوش مصنوعی می‌سازد. او بنیان‌گذار، مدیرعامل و توسعه‌دهندهٔ «پاد»، یک پلتفرم مدیریت بحران، و سازندهٔ WebGuard، ابزار بررسی وضعیت امنیتی وب‌سایت‌ها، است.',
  } satisfies L10n,
  email: 'amirmahdi.najafi2023@gmail.com',
  telegram: 'https://t.me/Im_Amir_nj',
  github: 'https://github.com/AR-MI2008',
  githubUser: 'AR-MI2008',
  /** Leave empty until the real profiles exist. Empty = icon not rendered. */
  linkedin: '',
  instagram: '',
  /** Availability is a CMS-controlled boolean. Nothing is claimed when false. */
  availability: {
    open: true,
    label: {
      en: 'Open to new projects',
      fa: 'پذیرای پروژه‌های جدید',
    } satisfies L10n,
  },
} as const;

export function socialLinks(): SocialLink[] {
  return [
    { id: 'github', label: 'GitHub', href: site.github },
    { id: 'telegram', label: 'Telegram', href: site.telegram },
    { id: 'email', label: 'Email', href: `mailto:${site.email}` },
    { id: 'linkedin', label: 'LinkedIn', href: site.linkedin },
    { id: 'instagram', label: 'Instagram', href: site.instagram },
  ].filter((link): link is SocialLink => link.href.length > 0);
}

/**
 * schema.org sameAs: profiles that unambiguously identify the SAME person.
 *
 * GitHub qualifies — the account carries the work referenced on this site.
 * Telegram deliberately does not: a username is not identity evidence, it can
 * be changed or reassigned, and a wrong sameAs edge is worse for entity
 * resolution than no edge. It stays as a contact link only.
 * LinkedIn and Instagram are absent until real profiles exist.
 */
export function sameAs(): string[] {
  return [site.github, site.linkedin, site.instagram].filter(Boolean);
}

/**
 * Verified metrics only. Every entry must be a number Amirmahdi can defend.
 * The UI renders 2–5 entries and hides the whole section below 2.
 * DO NOT add client counts, user counts, revenue or awards.
 */
export type Metric = { id: string; value: string; label: L10n; note?: L10n };

/**
 * Verified metrics only — and right now there are none.
 *
 * Three were removed (see docs/CONTENT-FACT-CHECK.md). The worst offender
 * claimed five products "shipped and running" while two of those five are
 * marked prototype and in-development on their own case-study pages. A number
 * a reader can disprove by clicking through costs more trust than it buys.
 *
 * The homepage renders this section only at 2+ entries, so an empty array is
 * a supported, deliberate state — not a gap waiting to be filled.
 *
 * Add an entry only if a stranger could check it and reach the same number.
 * Never add client counts, user counts, revenue or awards.
 */
export const metrics: Metric[] = [];

/** Curated stack. Only technologies actually used in shipped work. */
export const stack = [
  { group: { en: 'Frontend', fa: 'فرانت‌اند' }, items: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS'] },
  { group: { en: 'Backend', fa: 'بک‌اند' }, items: ['Django', 'Django REST Framework', 'Python', 'Node.js'] },
  { group: { en: 'Data', fa: 'داده' }, items: ['PostgreSQL', 'Redis', 'Celery'] },
  { group: { en: 'Infrastructure', fa: 'زیرساخت' }, items: ['Docker', 'Nginx', 'Linux', 'Certbot'] },
  { group: { en: 'Hardware', fa: 'سخت‌افزار' }, items: ['ESP32', 'Arduino', 'C++'] },
] as const;

/** Homepage "What I build" — capabilities, not a badge wall. */
export const capabilities: { id: string; title: L10n; body: L10n }[] = [
  {
    id: 'web-apps',
    title: { en: 'Web applications', fa: 'اپلیکیشن‌های وب' },
    body: {
      en: 'Product-grade applications with real state, real auth and real data — not brochure sites.',
      fa: 'اپلیکیشن‌هایی در سطح محصول با وضعیت، احراز هویت و دادهٔ واقعی؛ نه سایت معرفی.',
    },
  },
  {
    id: 'ai',
    title: { en: 'AI solutions', fa: 'راهکارهای هوش مصنوعی' },
    body: {
      en: 'Practical model integration inside products and workflows: retrieval, classification, assistive interfaces.',
      fa: 'یکپارچه‌سازی عملی مدل‌ها در محصول و فرایند کاری: بازیابی، دسته‌بندی و رابط‌های کمکی.',
    },
  },
  {
    id: 'backend',
    title: { en: 'Backend systems', fa: 'سیستم‌های بک‌اند' },
    body: {
      en: 'APIs, background jobs, schemas and the boring reliability work that keeps them up.',
      fa: 'API، کارهای پس‌زمینه، طراحی اسکیمای داده و همان کارهای کسل‌کنندهٔ پایداری.',
    },
  },
  {
    id: 'products',
    title: { en: 'Digital products', fa: 'محصولات دیجیتال' },
    body: {
      en: 'End-to-end ownership: positioning, interface, build, deploy, and what happens after launch.',
      fa: 'مالکیت کامل: جایگاه محصول، رابط، ساخت، استقرار و آنچه پس از انتشار پیش می‌آید.',
    },
  },
  {
    id: 'automation',
    title: { en: 'Automation & integrations', fa: 'اتوماسیون و یکپارچه‌سازی' },
    body: {
      en: 'Internal dashboards, bots and pipelines that remove repeated manual work.',
      fa: 'داشبورد داخلی، ربات و خط‌لوله‌هایی که کار دستی تکراری را حذف می‌کنند.',
    },
  },
  {
    id: 'hardware',
    title: { en: 'Product engineering', fa: 'مهندسی محصول' },
    body: {
      en: 'Firmware, electronics and the software around them when a product needs to exist physically.',
      fa: 'فرم‌ور، الکترونیک و نرم‌افزار پیرامون آن، وقتی محصول باید وجود فیزیکی داشته باشد.',
    },
  },
];
