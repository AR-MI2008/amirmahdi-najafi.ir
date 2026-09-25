import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { buildMetadata } from '@/lib/seo';
import { getSiteConfig, getStack, getProjects } from '@/lib/content-source';

const site = getSiteConfig();
import { Breadcrumbs, ButtonLink, Container, JsonLd, Tick } from '@/components/ui/primitives';
import { breadcrumbSchema } from '@/lib/jsonld';

const copy = {
  intro: {
    en: 'I build software and run the products I build. Most of my work sits in the same place: a system that has to keep running for people who are not thinking about software while they use it.',
    fa: 'نرم‌افزار می‌سازم و محصولاتی را که می‌سازم خودم اداره می‌کنم. بیشتر کارم در یک نقطه متمرکز است: سیستمی که باید برای آدم‌هایی کار کند که هنگام استفاده اصلاً به نرم‌افزار فکر نمی‌کنند.',
  },
  how: {
    title: { en: 'How I work', fa: 'شیوهٔ کارم' },
    items: {
      en: [
        'Decide fast, in writing. A decision recorded badly is still better than a decision that lives in one person’s memory.',
        'Build the smallest thing that can be honestly called finished, put it in front of someone, then extend it.',
        'Treat security and accessibility as build constraints, not a phase at the end. Both are much cheaper before the code exists.',
        'Say what is not built. A roadmap presented as a feature list is the fastest way to lose a client’s trust.',
      ],
      fa: [
        'سریع تصمیم بگیر و بنویس. تصمیمی که بد ثبت شده باشد باز از تصمیمی که در حافظهٔ یک نفر زندگی می‌کند بهتر است.',
        'کوچک‌ترین چیزی را بساز که بشود صادقانه «تمام‌شده» نامیدش، جلوی یک نفر بگذار، بعد گسترشش بده.',
        'امنیت و دسترس‌پذیری را محدودیت ساخت بدان، نه مرحله‌ای در انتها. هر دو پیش از نوشتن کد بسیار ارزان‌ترند.',
        'بگو چه چیزی ساخته نشده. ارائهٔ نقشهٔ راه به‌جای فهرست قابلیت‌ها سریع‌ترین راه از دست دادن اعتماد مشتری است.',
      ],
    },
  },
  interests: {
    title: { en: 'What I pay attention to', fa: 'به چه چیزهایی توجه می‌کنم' },
    items: {
      en: [
        'Web security posture — the configuration layer most sites never look at.',
        'Systems that have to work on constrained and filtered networks.',
        'Applied AI inside real products, rather than as a demo.',
        'Embedded hardware, mostly because it refuses to let me be imprecise.',
      ],
      fa: [
        'وضعیت امنیتی وب — همان لایهٔ پیکربندی که بیشتر سایت‌ها هرگز نگاهش نمی‌کنند.',
        'سیستم‌هایی که باید روی شبکه‌های محدود و فیلترشده کار کنند.',
        'هوش مصنوعی کاربردی درون محصول واقعی، نه در حد دمو.',
        'سخت‌افزار امبدد، بیشتر به این دلیل که اجازه نمی‌دهد بی‌دقت باشم.',
      ],
    },
  },
  now: { en: 'What I am building now', fa: 'الان چه می‌سازم' },
  milestones: { en: 'Selected milestones', fa: 'نقاط عطف منتخب' },
} as const;

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
    path: '/about',
    title: locale === 'en' ? 'About' : 'درباره',
    description: site.bio[locale],
  });
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const dict = await getDictionary(locale);
  const stack = await getStack();
  const projects = await getProjects();
  const active = projects.filter((p) => p.status === 'live' || p.status === 'in-development');

  return (
    <Container className="py-16 md:py-24">
      <JsonLd
        data={breadcrumbSchema([
          { name: dict.breadcrumb.home, path: `/${locale}` },
          { name: dict.nav.about, path: `/${locale}/about` },
        ])}
      />
      <Breadcrumbs
        items={[{ name: dict.breadcrumb.home, href: `/${locale}` }, { name: dict.nav.about }]}
      />

      <h1 className="max-w-3xl text-[length:var(--text-3xl)] font-medium leading-[1.1] tracking-[-0.03em]">
        {site.headline[locale]}
      </h1>
      <p className="prose-body mt-6">{copy.intro[locale]}</p>

      <div className="mt-20 grid gap-16 lg:grid-cols-2">
        <section>
          <h2 className="text-[length:var(--text-xl)] font-medium tracking-[-0.02em]">
            {copy.how.title[locale]}
          </h2>
          <ul className="mt-6 space-y-4">
            {copy.how.items[locale].map((item) => (
              <li key={item} className="border-s border-line ps-5 text-[length:var(--text-base)] leading-relaxed text-muted">
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-[length:var(--text-xl)] font-medium tracking-[-0.02em]">
            {copy.interests.title[locale]}
          </h2>
          <ul className="mt-6 space-y-4">
            {copy.interests.items[locale].map((item) => (
              <li key={item} className="border-s border-line ps-5 text-[length:var(--text-base)] leading-relaxed text-muted">
                {item}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="mt-20">
        <h2 className="text-[length:var(--text-xl)] font-medium tracking-[-0.02em]">
          {copy.now[locale]}
        </h2>
        <ul className="mt-6 divide-y divide-[color:var(--border)] border-y border-line">
          {active.map((project) => (
            <li key={project.slug}>
              <Link
                href={`/${locale}/projects/${project.slug}`}
                className="flex flex-wrap items-baseline justify-between gap-3 py-5 hover:text-accent"
              >
                <span className="text-[length:var(--text-lg)] font-medium">
                  {project.name[locale]}
                </span>
                <Tick>{project.role[locale]}</Tick>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-20">
        <h2 className="text-[length:var(--text-xl)] font-medium tracking-[-0.02em]">
          {dict.sections.stack}
        </h2>
        <dl className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
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
      </section>

      <div className="mt-20 flex flex-wrap gap-3 border-t border-line pt-10">
        <ButtonLink href={`/${locale}/contact`}>{dict.hero.secondary}</ButtonLink>
        <ButtonLink href={`/${locale}/projects`} variant="outline">
          {dict.hero.primary}
        </ButtonLink>
      </div>
    </Container>
  );
}
