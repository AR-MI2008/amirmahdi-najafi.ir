import type { L10n } from '@/i18n/config';

/* ==========================================================================
   Project content model. Mirrors payload/collections/projects.ts.
   Rule: nothing in here may be a claim Amirmahdi cannot defend.
   No invented users, revenue, clients, awards or cooperation.
   ========================================================================== */

export type ProjectStatus = 'live' | 'in-development' | 'prototype' | 'delivered';
/**
 * 'unverified' is the default for anything the owner has not personally
 * confirmed against docs/CONTENT-FACT-CHECK.md. The UI never renders an
 * unverified capability, so an unchecked claim cannot reach a visitor.
 */
export type CapabilityState = 'implemented' | 'in-progress' | 'planned' | 'unverified';

/** States that are safe to show publicly. */
export const PUBLISHABLE_CAPABILITY_STATES = ['implemented', 'in-progress', 'planned'] as const;

/**
 * Per-project visual identity, defined independently for each global theme.
 *
 * A project keeps its personality in light mode; the light palette is designed,
 * not derived by inverting the dark one. Every value below is asserted by
 * tests/unit/project-theme.test.ts: foreground, muted and accent must clear
 * 4.5:1 against both background and surface, and accentSecondary - which is
 * decorative only, never text - must clear 3:1.
 */
export type ProjectPalette = {
  /** Page background behind the project hero. */
  background: string;
  /** Panel background inside the hero (motif frame, cards). */
  surface: string;
  /** Text-bearing accent: category label, links, rules. */
  accent: string;
  /** Decorative only - gradients and motif strokes. Never used for text. */
  accentSecondary: string;
  /** Body text on this project's background. */
  foreground: string;
  /** Secondary text on this project's background. */
  muted: string;
};

export type ProjectTheme = {
  /** Substrate geometry drawn behind the project hero. */
  motif: 'radar' | 'topology' | 'flow' | 'trace' | 'catalogue';
  /** Accent glow restraint in dark mode, 0-1. */
  glow: number;
  /** Glow restraint in light mode. Lower, because glow reads heavier on white. */
  glowLight: number;
  dark: ProjectPalette;
  light: ProjectPalette;
};

export type Capability = { state: CapabilityState; label: L10n };

export type CaseSection = {
  id: string;
  title: L10n;
  /** Paragraphs. Rendered as <p>, never as raw HTML. */
  body: L10n<string[]>;
};

export type Project = {
  slug: string;
  name: L10n;
  category: L10n;
  role: L10n;
  /*
   * Dates are OPTIONAL, and an unverified date must stay absent.
   * A missing date renders nothing and appears in no metadata or JSON-LD.
   * See docs/CONTENT-FACT-CHECK.md before filling any of these in.
   */
  /** ISO 8601, e.g. '2024-03'. */
  startDate?: string;
  /** ISO 8601. Absent means ongoing OR unverified - status disambiguates. */
  endDate?: string;
  /** Optional human label, shown instead of a computed range. */
  displayDate?: L10n;
  status: ProjectStatus;
  featured: boolean;
  order: number;
  /** One line for cards and meta descriptions. */
  summary: L10n;
  /** Two or three sentences for the case study hero. */
  intro: L10n;
  tech: string[];
  links: { label: L10n; href: string }[];
  /**
   * The URL that IS this project, for schema.org sameAs. Set only where the
   * URL unambiguously represents the same work. Absent means no sameAs is
   * emitted - never fall back to the first arbitrary link.
   */
  canonicalUrl?: string;
  theme: ProjectTheme;
  capabilities: Capability[];
  sections: CaseSection[];
  /** Screenshots are CMS-managed. Empty array renders no gallery. */
  gallery: { src: string; alt: L10n; width: number; height: number }[];
};

export const projects: Project[] = [
  {
    slug: 'pad-system',
    name: { en: 'PAD System', fa: 'سامانهٔ پاد' },
    category: { en: 'Crisis management platform', fa: 'پلتفرم مدیریت بحران' },
    role: { en: 'Founder, CEO & Developer', fa: 'بنیان‌گذار، مدیرعامل و توسعه‌دهنده' },
    status: 'live',
    featured: true,
    order: 1,
    summary: {
      en: 'A crisis-management platform for Iranian citizens: a live crisis map, verified news, a missing-persons registry and aid requests.',
      fa: 'پلتفرم مدیریت بحران برای شهروندان ایرانی: نقشهٔ بحران، اخبار راستی‌آزمایی‌شده، سامانهٔ مفقودین و درخواست کمک.',
    },
    intro: {
      en: 'PAD is the product I own completely. It exists because during a crisis the information people need is scattered across channels that contradict each other. PAD puts a verified map, a news pipeline and a request system behind one installable app.',
      fa: 'پاد محصولی است که کاملاً مال خودم است. دلیل وجودش این است که در بحران، اطلاعاتی که مردم لازم دارند میان کانال‌هایی پخش است که یکدیگر را نقض می‌کنند. پاد یک نقشهٔ راستی‌آزمایی‌شده، خط‌لولهٔ خبری و سامانهٔ درخواست را پشت یک اپلیکیشن نصب‌شدنی جمع می‌کند.',
    },
    tech: ['Django', 'DRF', 'Next.js', 'TypeScript', 'PostgreSQL', 'Redis', 'Celery', 'Docker', 'Nginx'],
    links: [{ label: { en: 'pad-system.ir', fa: 'pad-system.ir' }, href: 'https://pad-system.ir' }],
    canonicalUrl: 'https://pad-system.ir',
    theme: {
      motif: 'radar',
      glow: 0.55,
      glowLight: 0.3,
      dark: {
        background: '#080c10',
        surface: '#0d141c',
        accent: '#00b4d8',
        accentSecondary: '#0077b6',
        foreground: '#eef6fa',
        muted: '#8fa3b0',
      },
      light: {
        // Deliberately not #eef6fa: that is the dark palette's foreground, and
        // reusing it would make this an inversion rather than a designed
        // palette. tests/unit/project-theme.test.ts asserts the difference.
        background: '#ecf4f9',
        surface: '#ffffff',
        accent: '#00637f',
        accentSecondary: '#004f6b',
        foreground: '#06171f',
        muted: '#4c6470',
      },
    },
    capabilities: [
      { state: 'unverified', label: { en: 'Crisis map with verified reports', fa: 'نقشهٔ بحران با گزارش‌های تأییدشده' } },
      { state: 'unverified', label: { en: 'Automated verified-news pipeline', fa: 'خط‌لولهٔ خودکار اخبار راستی‌آزمایی‌شده' } },
      { state: 'unverified', label: { en: 'Missing-persons registry', fa: 'سامانهٔ ثبت مفقودین' } },
      { state: 'unverified', label: { en: 'Aid requests and SOS action', fa: 'درخواست کمک و دکمهٔ اضطرار' } },
      { state: 'unverified', label: { en: 'Installable PWA and Android package', fa: 'اپلیکیشن نصب‌شدنی و بستهٔ اندروید' } },
      { state: 'unverified', label: { en: 'Biometric sign-in via WebAuthn', fa: 'ورود بیومتریک با WebAuthn' } },
      { state: 'unverified', label: { en: 'Operator console for regional coordinators', fa: 'کنسول اپراتور برای هماهنگ‌کنندگان منطقه‌ای' } },
    ],
    sections: [
      {
        id: 'problem',
        title: { en: 'Problem', fa: 'مسئله' },
        body: {
          en: [
            'In a crisis the bottleneck is not the absence of information — it is the absence of information you can act on. Reports arrive through messaging channels with no provenance, no location and no way to tell a first-hand account from a screenshot of a screenshot.',
            'The second problem is asymmetry. People who need help and people who can give it are on the same networks, but there is no shared structure that connects a specific request to a specific responder.',
          ],
          fa: [
            'در بحران، گلوگاه نبودِ اطلاعات نیست؛ نبودِ اطلاعاتی است که بشود بر اساسش عمل کرد. گزارش‌ها از کانال‌های پیام‌رسان می‌رسند، بدون منبع، بدون موقعیت و بدون راهی برای تشخیص روایت دست‌اول از اسکرین‌شاتِ اسکرین‌شات.',
            'مسئلهٔ دوم عدم‌تقارن است. کسی که کمک لازم دارد و کسی که می‌تواند کمک کند روی یک شبکه‌اند، اما ساختار مشترکی نیست که یک درخواست مشخص را به یک پاسخ‌دهندهٔ مشخص وصل کند.',
          ],
        },
      },
      {
        id: 'product',
        title: { en: 'What I built', fa: 'چه چیزی ساختم' },
        body: {
          en: [
            'PAD is four surfaces on one data model. A crisis map that only renders reports that passed review. A news pipeline that ingests from a defined source, normalises it and republishes it to the site and to messaging channels. A missing-persons registry with a structured record rather than free text. And a request system where an aid request is a first-class object with a state machine.',
            'It ships as an installable PWA and as an Android package, because in the moment people need it, an app icon on the home screen beats a URL they have to remember.',
          ],
          fa: [
            'پاد چهار سطح روی یک مدل داده است. نقشهٔ بحران که فقط گزارش‌های تأییدشده را نمایش می‌دهد. خط‌لولهٔ خبری که از منبعی مشخص می‌خواند، آن را نرمال‌سازی می‌کند و روی سایت و کانال‌های پیام‌رسان بازنشر می‌دهد. سامانهٔ مفقودین با رکورد ساختاریافته به‌جای متن آزاد. و سامانهٔ درخواست، که در آن هر درخواست کمک یک شیء درجه‌یک با ماشین حالت است.',
            'خروجی هم به‌صورت PWA نصب‌شدنی است و هم بستهٔ اندروید؛ چون در لحظه‌ای که مردم به آن نیاز دارند، یک آیکون روی صفحهٔ گوشی از آدرسی که باید حفظ شود بهتر است.',
          ],
        },
      },
      {
        id: 'engineering',
        title: { en: 'Engineering', fa: 'مهندسی' },
        body: {
          en: [
            'Django and Django REST Framework on the backend, Next.js and TypeScript on the front, PostgreSQL for state, Redis and Celery for anything that must not happen inside a request cycle. The whole stack runs under Docker Compose behind Nginx with automated certificate renewal.',
            'The news pipeline runs on a separate machine from the application. That is deliberate: ingestion is the noisiest, most failure-prone part of the system, and it should not be able to take the platform down with it.',
            'Sign-in supports WebAuthn, so a returning user authenticates with the biometric sensor already on their phone instead of a password they will reuse elsewhere.',
          ],
          fa: [
            'بک‌اند با Django و Django REST Framework، فرانت با Next.js و TypeScript، وضعیت روی PostgreSQL و هر کاری که نباید داخل چرخهٔ درخواست انجام شود روی Redis و Celery. کل استک زیر Docker Compose پشت Nginx با تمدید خودکار گواهی اجرا می‌شود.',
            'خط‌لولهٔ خبری روی ماشینی جدا از اپلیکیشن اجرا می‌شود. این تصمیم عمدی است: دریافت داده پرسروصداترین و شکننده‌ترین بخش سیستم است و نباید بتواند کل پلتفرم را با خودش پایین بیاورد.',
            'ورود از WebAuthn پشتیبانی می‌کند، بنابراین کاربر بازگشته با همان حسگر بیومتریک گوشی‌اش احراز هویت می‌شود، نه رمزی که جای دیگر هم از آن استفاده می‌کند.',
          ],
        },
      },
      {
        id: 'design',
        title: { en: 'Design system', fa: 'سیستم طراحی' },
        body: {
          en: [
            'PAD is designed as an instrument, not a news site. Cyan for the interface, a single reserved red for genuine emergency states, green for confirmed-safe. The red is used sparingly on purpose: an interface that shouts constantly stops being read.',
            'Everything is Persian-first and right-to-left by default, with numerals, dates and typography set for Persian rather than retrofitted onto a Latin layout.',
          ],
          fa: [
            'پاد مثل یک ابزار طراحی شده، نه یک سایت خبری. فیروزه‌ای برای رابط، یک قرمز رزروشده فقط برای وضعیت اضطراری واقعی، و سبز برای وضعیت ایمنِ تأییدشده. قرمز عمداً کم استفاده می‌شود: رابطی که مدام فریاد بزند، دیگر خوانده نمی‌شود.',
            'همه‌چیز فارسی‌محور و راست‌به‌چپ است؛ اعداد، تاریخ‌ها و تایپوگرافی برای فارسی تنظیم شده‌اند، نه اینکه روی چیدمان لاتین وصله شوند.',
          ],
        },
      },
      {
        id: 'challenges',
        title: { en: 'Challenges', fa: 'چالش‌ها' },
        body: {
          en: [
            'Building for Iranian network conditions changes every default. Third-party CDNs cannot be relied on, so assets and fonts are self-hosted. Outbound API calls may fail for reasons that have nothing to do with your code, so everything that talks to the outside world has to degrade instead of erroring.',
            'The harder problem is editorial, not technical: deciding what counts as verified, and making that policy visible in the interface rather than hidden in a moderator’s head.',
          ],
          fa: [
            'ساختن برای شرایط شبکهٔ ایران هر پیش‌فرضی را عوض می‌کند. به CDN شخص ثالث نمی‌شود تکیه کرد، پس فایل‌ها و فونت‌ها روی سرور خودمان میزبانی می‌شوند. درخواست‌های خروجی ممکن است به دلایلی بی‌ربط به کد شما شکست بخورند، پس هر چیزی که با دنیای بیرون حرف می‌زند باید افت کیفیت کند، نه خطا بدهد.',
            'مسئلهٔ سخت‌تر ویراستاری است نه فنی: اینکه چه چیزی «تأییدشده» حساب می‌شود و چطور این سیاست در رابط کاربری دیده شود، نه اینکه در ذهن یک ناظر بماند.',
          ],
        },
      },
      {
        id: 'lessons',
        title: { en: 'What I learned', fa: 'چه یاد گرفتم' },
        body: {
          en: [
            'Owning a product end to end means the interesting decisions are rarely the technical ones. Choosing what PAD refuses to publish shaped the platform more than any architectural choice.',
            'Separating the fragile subsystem onto its own machine was the single highest-return decision. It converted a class of total outages into a class of degraded features.',
          ],
          fa: [
            'مالکیت کامل یک محصول یعنی تصمیم‌های جالب معمولاً فنی نیستند. انتخاب اینکه پاد چه چیزی را منتشر نمی‌کند، بیشتر از هر تصمیم معماری پلتفرم را شکل داد.',
            'جدا کردن زیرسیستم شکننده روی ماشین مستقل، پربازده‌ترین تصمیم بود. دسته‌ای از قطعی‌های کامل را به دسته‌ای از قابلیت‌های تضعیف‌شده تبدیل کرد.',
          ],
        },
      },
    ],
    gallery: [],
  },

  {
    slug: 'webguard',
    name: { en: 'WebGuard', fa: 'وب‌گارد' },
    category: { en: 'Web security posture checker', fa: 'ابزار بررسی وضعیت امنیتی وب' },
    role: { en: 'Creator & Lead Engineer', fa: 'سازنده و مهندس ارشد' },
    status: 'in-development',
    featured: true,
    order: 2,
    summary: {
      en: 'Enter a domain, get an explainable 0–100 report on HTTPS, TLS, security headers, DNS and configuration. Passive checks only.',
      fa: 'یک دامنه وارد کنید و گزارشی قابل‌توضیح از ۰ تا ۱۰۰ دربارهٔ HTTPS، TLS، هدرهای امنیتی، DNS و پیکربندی بگیرید. فقط بررسی غیرفعال.',
    },
    intro: {
      en: 'WebGuard answers one question well: is this website configured the way a competent team would configure it? It reads only what a browser could already see, scores it transparently, and explains every deduction.',
      fa: 'وب‌گارد به یک پرسش خوب پاسخ می‌دهد: آیا این وب‌سایت همان‌طور پیکربندی شده که یک تیم توانمند پیکربندی می‌کرد؟ فقط چیزی را می‌خواند که مرورگر هم می‌تواند ببیند، شفاف امتیاز می‌دهد و دلیل هر کسری را توضیح می‌دهد.',
    },
    tech: ['Django', 'DRF', 'Celery', 'Redis', 'PostgreSQL', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Docker'],
    links: [
      { label: { en: 'Repository', fa: 'مخزن کد' }, href: 'https://github.com/AR-MI2008/webguard' },
    ],
    // The repository is the project: same artefact, not a page about it.
    canonicalUrl: 'https://github.com/AR-MI2008/webguard',
    theme: {
      motif: 'flow',
      glow: 0.4,
      glowLight: 0.22,
      dark: {
        background: '#080b12',
        surface: '#151c28',
        accent: '#22d3ee',
        accentSecondary: '#3b82f6',
        foreground: '#eaf4f8',
        muted: '#93a3b5',
      },
      light: {
        background: '#eff7fa',
        surface: '#ffffff',
        accent: '#0e6f86',
        accentSecondary: '#1d4ed8',
        foreground: '#08151c',
        muted: '#4f6270',
      },
    },
    capabilities: [
      { state: 'unverified', label: { en: 'SSRF-safe request layer with pinned-IP connections', fa: 'لایهٔ درخواست ایمن در برابر SSRF با اتصال به IP پین‌شده' } },
      { state: 'unverified', label: { en: 'HTTPS and TLS certificate inspection', fa: 'بررسی HTTPS و گواهی TLS' } },
      { state: 'unverified', label: { en: 'Security header analysis', fa: 'تحلیل هدرهای امنیتی' } },
      { state: 'unverified', label: { en: 'DNS and mail-record checks reported as information', fa: 'بررسی رکوردهای DNS و ایمیل به‌عنوان اطلاعات' } },
      { state: 'unverified', label: { en: 'Weighted, explainable 0–100 score', fa: 'امتیاز وزن‌دار و قابل‌توضیح ۰ تا ۱۰۰' } },
      { state: 'unverified', label: { en: 'Results dashboard and shareable scan pages', fa: 'داشبورد نتایج و صفحهٔ اشتراک‌گذاری اسکن' } },
      { state: 'unverified', label: { en: 'Accounts, scheduled re-scans and change alerts', fa: 'حساب کاربری، اسکن زمان‌بندی‌شده و هشدار تغییرات' } },
    ],
    sections: [
      {
        id: 'goal',
        title: { en: 'Goal', fa: 'هدف' },
        body: {
          en: [
            'Most site owners do not know whether their configuration is sound, and the tools that tell them are either enterprise products or unexplained letter grades. WebGuard is the middle: free, public, and specific about why it deducted a point.',
            'It is explicitly not a penetration-testing tool. It does not exploit, brute force, scan ports or enumerate directories. It reads publicly observable configuration and nothing else.',
          ],
          fa: [
            'بیشتر صاحبان سایت نمی‌دانند پیکربندی‌شان درست است یا نه، و ابزارهایی که این را می‌گویند یا محصول سازمانی‌اند یا یک نمرهٔ حرفیِ بی‌توضیح. وب‌گارد حد وسط است: رایگان، عمومی و دقیق دربارهٔ اینکه چرا امتیاز کم کرده.',
            'این ابزار صراحتاً ابزار تست نفوذ نیست. اکسپلویت نمی‌کند، حملهٔ جست‌وجوی فراگیر ندارد، پورت اسکن نمی‌کند و دایرکتوری شمارش نمی‌کند. فقط پیکربندی قابل‌مشاهدهٔ عمومی را می‌خواند.',
          ],
        },
      },
      {
        id: 'safety',
        title: { en: 'Security philosophy', fa: 'فلسفهٔ امنیتی' },
        body: {
          en: [
            'A tool that fetches arbitrary user-supplied URLs is a server-side request forgery engine unless you design against it from the first commit. WebGuard resolves the hostname, rejects private, loopback, link-local and reserved address space, then connects to the exact resolved IP so DNS cannot change under the request. Redirects are re-validated at every hop.',
            'Those safety primitives — URL normalisation, resolution, redirect handling, address filtering, pinned connections — were built with tests before any scanner feature was allowed to depend on them.',
            'Two rules govern output. Never invent a result: if a check could not run, it reports UNKNOWN and is excluded from the score denominator rather than counted as a failure. And never call a site vulnerable because a header is missing — a missing header is a missing header.',
          ],
          fa: [
            'ابزاری که آدرس دلخواه کاربر را واکشی می‌کند، اگر از اولین کامیت برایش طراحی نکنید، یک موتور SSRF است. وب‌گارد نام میزبان را resolve می‌کند، فضای آدرس خصوصی، loopback، link-local و رزروشده را رد می‌کند و سپس دقیقاً به همان IP وصل می‌شود تا DNS زیر پای درخواست عوض نشود. تغییر مسیرها در هر پرش دوباره اعتبارسنجی می‌شوند.',
            'این ابتدایی‌های ایمنی — نرمال‌سازی آدرس، resolve، مدیریت ریدایرکت، فیلتر آدرس و اتصال پین‌شده — پیش از آنکه هیچ قابلیت اسکنری به آن‌ها وابسته شود، همراه با تست نوشته شدند.',
            'دو قاعده بر خروجی حاکم است. هرگز نتیجه نساز: اگر بررسی‌ای اجرا نشد، UNKNOWN گزارش می‌شود و از مخرج امتیاز حذف می‌شود، نه اینکه شکست حساب شود. و هرگز سایتی را فقط به‌خاطر نبودِ یک هدر «آسیب‌پذیر» ننام؛ نبودِ هدر یعنی نبودِ هدر.',
          ],
        },
      },
      {
        id: 'scoring',
        title: { en: 'Scoring', fa: 'امتیازدهی' },
        body: {
          en: [
            'The score is weighted: security headers 35 percent, HTTPS and TLS 25, configuration 20, DNS and infrastructure 10, basic response performance 10. Checks that return UNKNOWN or NOT APPLICABLE leave the denominator, so a site is never punished for a check that could not run.',
            'SPF and DMARC are reported as informational rather than security failures. They matter, but a marketing site without DMARC is not insecure in the way the word implies.',
          ],
          fa: [
            'امتیاز وزن‌دار است: هدرهای امنیتی ۳۵ درصد، HTTPS و TLS ۲۵، پیکربندی ۲۰، DNS و زیرساخت ۱۰ و کارایی پایهٔ پاسخ ۱۰. بررسی‌هایی که UNKNOWN یا NOT APPLICABLE برمی‌گردانند از مخرج خارج می‌شوند، پس هیچ سایتی بابت بررسی‌ای که اجرا نشده جریمه نمی‌شود.',
            'SPF و DMARC اطلاعاتی گزارش می‌شوند، نه شکست امنیتی. مهم‌اند، اما یک سایت معرفی بدون DMARC به آن معنایی که کلمه القا می‌کند ناامن نیست.',
          ],
        },
      },
      {
        id: 'architecture',
        title: { en: 'Architecture', fa: 'معماری' },
        body: {
          en: [
            'A Django and DRF backend runs scans as Celery tasks so a slow target never occupies a web worker. PostgreSQL holds scan records, Redis is the broker. The frontend is Next.js with the App Router and TypeScript.',
            'Abuse controls are per-IP rate limits, a per-target cooldown, and reuse of a recent scan within a short window so re-running a scan after a config change is still possible. Raw client IPs are never stored — the abuse identifier is a keyed hash with a server-side secret, and scan records become eligible for automatic deletion after thirty days.',
          ],
          fa: [
            'بک‌اند Django و DRF اسکن‌ها را به‌صورت وظیفهٔ Celery اجرا می‌کند تا یک هدف کُند هیچ‌وقت worker وب را اشغال نکند. PostgreSQL رکورد اسکن‌ها را نگه می‌دارد و Redis واسط صف است. فرانت‌اند Next.js با App Router و TypeScript است.',
            'کنترل سوءاستفاده شامل محدودیت نرخ به‌ازای IP، فاصلهٔ اجباری برای هر هدف، و استفادهٔ مجدد از اسکن اخیر در بازه‌ای کوتاه است تا اسکن دوباره پس از تغییر پیکربندی ممکن بماند. IP خام کاربر هرگز ذخیره نمی‌شود؛ شناسهٔ سوءاستفاده یک هش کلیددار با راز سمت سرور است و رکوردهای اسکن پس از سی روز مشمول حذف خودکار می‌شوند.',
          ],
        },
      },
      {
        id: 'status',
        title: { en: 'Development status', fa: 'وضعیت توسعه' },
        body: {
          en: [
            'The safety layer, probe set, scoring engine and API are built. The results dashboard is in progress. Accounts, monitoring and notifications are on the roadmap and deliberately not built — the architecture leaves room for them without pretending they exist.',
          ],
          fa: [
            'لایهٔ ایمنی، مجموعهٔ کاوشگرها، موتور امتیازدهی و API ساخته شده‌اند. داشبورد نتایج در حال توسعه است. حساب کاربری، پایش و اعلان‌ها در نقشهٔ راه‌اند و عمداً ساخته نشده‌اند؛ معماری جا برایشان باز گذاشته بدون آنکه وانمود کند وجود دارند.',
          ],
        },
      },
    ],
    gallery: [],
  },

  {
    slug: 'melamin-layegh',
    name: { en: 'Melamin Layegh', fa: 'ملامین لایق' },
    category: { en: 'Manufacturer e-commerce site', fa: 'سایت فروشگاهی تولیدکننده' },
    role: { en: 'Web Developer (client project)', fa: 'توسعه‌دهندهٔ وب (پروژهٔ مشتری)' },
    status: 'delivered',
    featured: true,
    order: 3,
    summary: {
      en: 'A full WordPress and WooCommerce site for an Iranian melamine tableware manufacturer: custom theme, 91 products, 10 categories, mail delivery.',
      fa: 'سایت کامل وردپرس و ووکامرس برای یک تولیدکنندهٔ ظروف ملامین ایرانی: قالب اختصاصی، ۹۱ محصول، ۱۰ دسته و راه‌اندازی ایمیل.',
    },
    intro: {
      en: 'A commercial project, and a useful counterweight to the rest of this portfolio. The brief was not to be clever. It was to give a manufacturer that has been producing since 1360 a catalogue their customers can actually browse.',
      fa: 'یک پروژهٔ تجاری، و تعادلی مفید در برابر بقیهٔ این نمونه‌کارها. صورت‌مسئله «هوشمندانه بودن» نبود؛ این بود که تولیدکننده‌ای که از ۱۳۶۰ در حال تولید است، کاتالوگی داشته باشد که مشتریانش واقعاً بتوانند مرور کنند.',
    },
    tech: ['WordPress', 'WooCommerce', 'PHP 8', 'MySQL', 'cPanel'],
    links: [
      { label: { en: 'melaminelayegh.ir', fa: 'melaminelayegh.ir' }, href: 'https://melaminelayegh.ir' },
    ],
    // The delivered site itself. HyperNet and Arc Core get no canonicalUrl:
    // neither has a public URL that represents the project.
    canonicalUrl: 'https://melaminelayegh.ir',
    theme: {
      motif: 'catalogue',
      glow: 0.18,
      glowLight: 0.12,
      dark: {
        background: '#17130f',
        surface: '#221c16',
        accent: '#d08a4e',
        accentSecondary: '#a9682f',
        foreground: '#f5efe8',
        muted: '#ab9c8c',
      },
      light: {
        background: '#faf4ec',
        surface: '#ffffff',
        accent: '#8a4b18',
        accentSecondary: '#6d3a11',
        foreground: '#221708',
        muted: '#6b5945',
      },
    },
    capabilities: [
      { state: 'unverified', label: { en: 'Custom WordPress theme', fa: 'قالب اختصاصی وردپرس' } },
      { state: 'unverified', label: { en: '91 products across 10 categories', fa: '۹۱ محصول در ۱۰ دسته' } },
      { state: 'unverified', label: { en: 'WooCommerce catalogue and enquiry flow', fa: 'کاتالوگ ووکامرس و مسیر استعلام' } },
      { state: 'unverified', label: { en: 'Domain-authenticated SMTP delivery', fa: 'ارسال ایمیل با SMTP دامنه' } },
      { state: 'unverified', label: { en: 'Persian-first responsive layout', fa: 'چیدمان واکنش‌گرای فارسی‌محور' } },
    ],
    sections: [
      {
        id: 'context',
        title: { en: 'Business context', fa: 'زمینهٔ کسب‌وکار' },
        body: {
          en: [
            'Melamin Layegh manufactures melamine tableware and has been operating since 1360 in the Iranian calendar. Their sales happen through wholesale relationships and direct enquiry, not impulse checkout. The website had to serve that reality rather than imitate a consumer marketplace.',
          ],
          fa: [
            'ملامین لایق تولیدکنندهٔ ظروف ملامین است و از سال ۱۳۶۰ فعالیت می‌کند. فروششان از طریق رابطهٔ عمده‌فروشی و استعلام مستقیم است، نه خرید آنی. سایت باید به همین واقعیت خدمت می‌کرد، نه اینکه ادای یک فروشگاه مصرفی را دربیاورد.',
          ],
        },
      },
      {
        id: 'challenge',
        title: { en: 'The challenge', fa: 'چالش' },
        body: {
          en: [
            'Ninety-one products in a category like tableware look alike in a thumbnail grid. A bowl is a bowl. The information that distinguishes them — size, set composition, colourway — is exactly the information a default WooCommerce archive buries.',
            'The second constraint was operational: the client had to be able to add products themselves after handover, without calling me.',
          ],
          fa: [
            'نود و یک محصول در دسته‌ای مثل ظروف، در شبکهٔ بندانگشتی شبیه هم به نظر می‌رسند. کاسه، کاسه است. اطلاعاتی که آن‌ها را متمایز می‌کند — اندازه، ترکیب سرویس، رنگ‌بندی — دقیقاً همان چیزی است که آرشیو پیش‌فرض ووکامرس دفن می‌کند.',
            'محدودیت دوم عملیاتی بود: مشتری باید بعد از تحویل، بدون تماس با من بتواند خودش محصول اضافه کند.',
          ],
        },
      },
      {
        id: 'implementation',
        title: { en: 'Implementation', fa: 'پیاده‌سازی' },
        body: {
          en: [
            'A custom theme rather than a purchased one, so the product archive could surface the distinguishing attributes at card level and the category structure could match how the factory actually organises its output — ten categories, mapped from their own catalogue.',
            'The catalogue import was scripted rather than entered by hand, which made the ninety-one products reproducible and let the client review the whole set before launch.',
            'Mail is sent through authenticated SMTP on the site’s own domain rather than the host’s default mailer, so enquiry notifications actually arrive instead of landing in spam.',
            'The site runs on cPanel hosting with PHP 8.',
          ],
          fa: [
            'قالب اختصاصی به‌جای قالب آماده، تا آرشیو محصول بتواند ویژگی‌های متمایزکننده را در سطح کارت نشان دهد و ساختار دسته‌بندی با شیوهٔ واقعی دسته‌بندی کارخانه بخواند — ده دسته، برگرفته از کاتالوگ خودشان.',
            'ورود کاتالوگ به‌جای وارد کردن دستی، اسکریپت‌نویسی شد؛ همین ۹۱ محصول را تکرارپذیر کرد و به مشتری اجازه داد کل مجموعه را پیش از انتشار بازبینی کند.',
            'ایمیل از طریق SMTP احرازشده روی دامنهٔ خود سایت ارسال می‌شود، نه میلر پیش‌فرض هاست؛ در نتیجه اعلان استعلام‌ها واقعاً می‌رسد و در اسپم نمی‌افتد.',
            'سایت روی هاست cPanel با PHP 8 اجرا می‌شود.',
          ],
        },
      },
      {
        id: 'outcome',
        title: { en: 'Outcome', fa: 'نتیجه' },
        body: {
          en: [
            'The site is live and the client manages the catalogue themselves. I am not publishing traffic or sales figures here, because I do not have measurements I can stand behind — and a case study with invented numbers is worth less than one without them.',
          ],
          fa: [
            'سایت منتشر شده و مشتری خودش کاتالوگ را مدیریت می‌کند. آمار بازدید یا فروش اینجا منتشر نمی‌کنم، چون اندازه‌گیری‌ای ندارم که پشتش بایستم؛ و مطالعهٔ موردی با عدد ساختگی از مطالعهٔ موردی بدون عدد بی‌ارزش‌تر است.',
          ],
        },
      },
    ],
    gallery: [],
  },

  {
    slug: 'hypernet',
    name: { en: 'HyperNet', fa: 'هایپرنت' },
    category: { en: 'Connectivity service & infrastructure', fa: 'سرویس اتصال و زیرساخت' },
    role: { en: 'Founder & Infrastructure Engineer', fa: 'بنیان‌گذار و مهندس زیرساخت' },
    status: 'live',
    featured: true,
    order: 4,
    summary: {
      en: 'A connectivity service with self-serve subscriptions through a Telegram bot, running on servers I provision, migrate and monitor myself.',
      fa: 'سرویس اتصال با اشتراک خودکار از طریق ربات تلگرام، روی سرورهایی که خودم راه‌اندازی، مهاجرت و پایش می‌کنم.',
    },
    intro: {
      en: 'HyperNet is the project that taught me operations. The product surface is small — pick a plan, get a config — but everything behind it is infrastructure work: provisioning, migration, monitoring, and recovering when a route stops working.',
      fa: 'هایپرنت پروژه‌ای است که عملیات را به من یاد داد. سطح محصول کوچک است — یک پلن انتخاب کن، کانفیگ بگیر — اما هرچه پشتش هست کار زیرساختی است: راه‌اندازی، مهاجرت، پایش و بازیابی وقتی مسیری از کار می‌افتد.',
    },
    tech: ['Linux', 'Python', 'Telegram Bot API', 'Nginx', 'Docker', 'PostgreSQL'],
    links: [],
    theme: {
      motif: 'topology',
      glow: 0.35,
      glowLight: 0.2,
      dark: {
        background: '#070910',
        surface: '#0e1220',
        accent: '#7c9cff',
        accentSecondary: '#4f6ef7',
        foreground: '#eef0fb',
        muted: '#99a1c0',
      },
      light: {
        background: '#f1f2fb',
        surface: '#ffffff',
        accent: '#3a45c4',
        accentSecondary: '#2b34a8',
        foreground: '#0b0e26',
        muted: '#565d85',
      },
    },
    capabilities: [
      { state: 'unverified', label: { en: 'Self-serve subscription bot', fa: 'ربات اشتراک خودکار' } },
      { state: 'unverified', label: { en: 'Multi-region server provisioning', fa: 'راه‌اندازی سرور در چند منطقه' } },
      { state: 'unverified', label: { en: 'Full infrastructure migration process', fa: 'فرایند مهاجرت کامل زیرساخت' } },
      { state: 'unverified', label: { en: 'Operational dashboard for service health', fa: 'داشبورد عملیاتی سلامت سرویس' } },
    ],
    sections: [
      {
        id: 'product',
        title: { en: 'The product', fa: 'محصول' },
        body: {
          en: [
            'HyperNet sells connectivity subscriptions. The entire customer journey — choosing a plan, paying, receiving configuration, renewing — runs through a Telegram bot, because that is where the users already are and because a bot has no app store, no install step and no bandwidth cost to open.',
            'The bot is on its eighth rebuild. Each rewrite removed state that had accumulated in the wrong place.',
          ],
          fa: [
            'هایپرنت اشتراک اتصال می‌فروشد. کل مسیر مشتری — انتخاب پلن، پرداخت، دریافت کانفیگ، تمدید — از طریق ربات تلگرام انجام می‌شود، چون کاربران همان‌جا هستند و چون ربات نه فروشگاه اپلیکیشن دارد، نه مرحلهٔ نصب، نه هزینهٔ پهنای باند برای باز شدن.',
            'ربات در نسخهٔ هشتم بازنویسی است. هر بازنویسی، وضعیتی را که در جای اشتباه انباشته شده بود حذف کرد.',
          ],
        },
      },
      {
        id: 'infrastructure',
        title: { en: 'Infrastructure', fa: 'زیرساخت' },
        body: {
          en: [
            'Servers are provisioned in European data centres and treated as replaceable. The most instructive piece of work was a complete migration of the service onto new infrastructure in Frankfurt: moving accounts, configuration and the bot itself without asking users to do anything.',
            'What that exercise proved is that a migration is only as good as the runbook. The second migration took a fraction of the time of the first, purely because the first one was written down.',
          ],
          fa: [
            'سرورها در مراکز دادهٔ اروپا راه‌اندازی می‌شوند و به‌عنوان قطعهٔ قابل‌تعویض با آن‌ها رفتار می‌شود. آموزنده‌ترین کار، مهاجرت کامل سرویس به زیرساخت جدید در فرانکفورت بود: انتقال حساب‌ها، پیکربندی و خود ربات، بدون آنکه کاربر کاری انجام دهد.',
            'آن تجربه ثابت کرد که کیفیت هر مهاجرت به اندازهٔ کیفیت مستندش است. مهاجرت دوم کسری از زمان اولی طول کشید، صرفاً چون اولی نوشته شده بود.',
          ],
        },
      },
      {
        id: 'claims',
        title: { en: 'What I do not claim', fa: 'آنچه ادعا نمی‌کنم' },
        body: {
          en: [
            'This section exists on purpose. Services in this category routinely advertise things that are not true: never disconnects, unblockable, one hundred percent anonymous. None of those are engineering statements, and I will not make them about HyperNet.',
            'What is true: the service is operated by one person, it has a defined migration process, and when a route degrades the response is to move, not to pretend.',
          ],
          fa: [
            'این بخش عمداً اینجاست. سرویس‌های این دسته معمولاً چیزهایی تبلیغ می‌کنند که درست نیست: هیچ‌وقت قطع نمی‌شود، غیرقابل‌مسدودسازی، صددرصد ناشناس. هیچ‌کدام گزارهٔ مهندسی نیستند و من آن‌ها را دربارهٔ هایپرنت نمی‌گویم.',
            'آنچه درست است: سرویس را یک نفر اداره می‌کند، فرایند مهاجرت تعریف‌شده دارد، و وقتی مسیری افت می‌کند پاسخ، جابه‌جا شدن است نه وانمود کردن.',
          ],
        },
      },
      {
        id: 'lessons',
        title: { en: 'Engineering lessons', fa: 'درس‌های مهندسی' },
        body: {
          en: [
            'Operating a service is a different discipline from building one. Uptime is not a feature you add; it is a set of habits — backups you have restored from, a migration you have rehearsed, alerts you actually read.',
            'Support volume is a design signal. Every question a user asks the bot twice is an interface I got wrong.',
          ],
          fa: [
            'اداره کردن سرویس رشته‌ای متفاوت از ساختن آن است. در دسترس بودن قابلیتی نیست که اضافه کنی؛ مجموعه‌ای از عادت‌هاست — پشتیبانی که واقعاً از آن بازیابی کرده‌ای، مهاجرتی که تمرین کرده‌ای، هشدارهایی که واقعاً می‌خوانی.',
            'حجم پشتیبانی یک سیگنال طراحی است. هر پرسشی که کاربر دو بار از ربات می‌پرسد، رابطی است که من اشتباه ساخته‌ام.',
          ],
        },
      },
    ],
    gallery: [],
  },

  {
    slug: 'arc-core',
    name: { en: 'Arc Core', fa: 'آرک کور' },
    category: { en: 'Wearable hardware', fa: 'سخت‌افزار پوشیدنی' },
    role: { en: 'Designer & Firmware Developer', fa: 'طراح و توسعه‌دهندهٔ فرم‌ور' },
    status: 'prototype',
    featured: true,
    order: 5,
    summary: {
      en: 'A wearable hardware project built around a circular core module. In prototype — this page separates what exists from what is planned.',
      fa: 'پروژهٔ سخت‌افزار پوشیدنی حول یک ماژول مرکزی دایره‌ای. در مرحلهٔ نمونهٔ اولیه — این صفحه آنچه هست را از آنچه برنامه‌ریزی شده جدا می‌کند.',
    },
    intro: {
      en: 'Arc Core is the project where I cannot hide behind software. A board either enumerates or it does not. It is at prototype stage, and everything below is labelled by what is actually working today.',
      fa: 'آرک کور پروژه‌ای است که در آن نمی‌توانم پشت نرم‌افزار پنهان شوم. یک برد یا شناسایی می‌شود یا نمی‌شود. در مرحلهٔ نمونهٔ اولیه است و هر چیزی که پایین می‌آید با وضعیت واقعی امروزش برچسب خورده.',
    },
    tech: ['ESP32', 'Arduino', 'C++', 'KiCad', '3D printing'],
    links: [],
    theme: {
      motif: 'trace',
      glow: 0.3,
      glowLight: 0.18,
      dark: {
        background: '#04070c',
        surface: '#0a1017',
        accent: '#5ec8ff',
        accentSecondary: '#2a8fd6',
        foreground: '#eaf3fa',
        muted: '#8d9dab',
      },
      light: {
        background: '#eef5fb',
        surface: '#ffffff',
        accent: '#0a6089',
        accentSecondary: '#084a6b',
        foreground: '#04121c',
        muted: '#4a5d6b',
      },
    },
    capabilities: [
      { state: 'unverified', label: { en: 'Core module bring-up and power path', fa: 'راه‌اندازی ماژول مرکزی و مسیر تغذیه' } },
      { state: 'unverified', label: { en: 'Sensor read loop on device firmware', fa: 'حلقهٔ خواندن حسگر در فرم‌ور دستگاه' } },
      { state: 'unverified', label: { en: 'Wireless link to a companion client', fa: 'اتصال بی‌سیم به کلاینت همراه' } },
      { state: 'unverified', label: { en: 'Enclosure and wearability revisions', fa: 'بازنگری بدنه و پوشیدنی بودن' } },
      { state: 'unverified', label: { en: 'Power budget and battery life work', fa: 'کار روی بودجهٔ توان و عمر باتری' } },
      { state: 'unverified', label: { en: 'Custom PCB replacing the development board', fa: 'برد چاپی اختصاصی به‌جای برد توسعه' } },
      { state: 'unverified', label: { en: 'On-device interface and haptics', fa: 'رابط روی دستگاه و بازخورد لمسی' } },
    ],
    sections: [
      {
        id: 'concept',
        title: { en: 'Concept', fa: 'ایده' },
        body: {
          en: [
            'A single circular core module that carries the compute, the radio and the sensing, with the rest of the wearable arranged around it. The geometry is not decorative: a round core is what lets the same module sit in more than one carrier.',
          ],
          fa: [
            'یک ماژول مرکزی دایره‌ای که پردازش، رادیو و حسگری را در خود دارد و بقیهٔ دستگاه پوشیدنی حول آن چیده می‌شود. این هندسه تزئینی نیست: مرکز گرد همان چیزی است که اجازه می‌دهد یک ماژول در بیش از یک نگه‌دارنده بنشیند.',
          ],
        },
      },
      {
        id: 'goals',
        title: { en: 'Design goals', fa: 'اهداف طراحی' },
        body: {
          en: [
            'Three constraints drive every decision. It has to be small enough to wear without thinking about it. It has to run long enough between charges that charging is a weekly habit, not a daily one. And the firmware has to fail safe — a wearable that hangs is worse than one that is off.',
          ],
          fa: [
            'سه محدودیت همهٔ تصمیم‌ها را هدایت می‌کند. باید آن‌قدر کوچک باشد که بدون فکر کردن پوشیده شود. باید بین دو شارژ آن‌قدر دوام بیاورد که شارژ کردن عادتی هفتگی باشد نه روزانه. و فرم‌ور باید ایمن شکست بخورد — دستگاه پوشیدنی‌ای که هنگ می‌کند از دستگاه خاموش بدتر است.',
          ],
        },
      },
      {
        id: 'hardware',
        title: { en: 'Hardware architecture', fa: 'معماری سخت‌افزار' },
        body: {
          en: [
            'The prototype is built on an ESP32 development board, chosen for the integrated radio and the amount of prior art available while the design is still moving. Sensing and power are on separate rails so that a noisy load cannot corrupt a reading.',
            'The current board is development hardware. A custom PCB is planned, not built — that step only makes sense once the module layout stops changing.',
          ],
          fa: [
            'نمونهٔ اولیه روی برد توسعهٔ ESP32 ساخته شده؛ به‌خاطر رادیوی یکپارچه و حجم تجربهٔ در دسترس، تا وقتی طراحی هنوز در حال تغییر است. حسگری و تغذیه روی ریل‌های جدا هستند تا بار پرنویز نتواند اندازه‌گیری را خراب کند.',
            'برد فعلی سخت‌افزار توسعه است. برد چاپی اختصاصی برنامه‌ریزی شده، نه ساخته‌شده؛ آن مرحله فقط وقتی معنا دارد که چیدمان ماژول از تغییر بایستد.',
          ],
        },
      },
      {
        id: 'firmware',
        title: { en: 'Firmware', fa: 'فرم‌ور' },
        body: {
          en: [
            'C++ on the Arduino toolchain. The loop is deliberately dull: read, timestamp, buffer, transmit when a link exists, drop the oldest sample when it does not. Nothing in the sensing path waits on the radio.',
            'Debugging embedded work is mostly the discipline of changing one variable at a time, which is the opposite of how I work on web software, and is the main reason this project has been useful to me.',
          ],
          fa: [
            'C++ روی زنجیرهٔ ابزار Arduino. حلقه عمداً کسل‌کننده است: بخوان، زمان بزن، بافر کن، اگر اتصال هست بفرست و اگر نیست قدیمی‌ترین نمونه را دور بینداز. هیچ‌چیز در مسیر حسگری منتظر رادیو نمی‌ماند.',
            'اشکال‌زدایی کار امبدد بیشتر انضباطِ تغییر دادن یک متغیر در هر بار است، که دقیقاً برعکس شیوهٔ کار من روی نرم‌افزار وب است، و همین دلیل اصلی مفید بودن این پروژه برای من است.',
          ],
        },
      },
      {
        id: 'state',
        title: { en: 'Current state', fa: 'وضعیت فعلی' },
        body: {
          en: [
            'Working today: the core module powers up reliably, reads its sensors and maintains a wireless link to a companion client. Being worked on: the enclosure, and the power budget. Not built: the custom PCB and the on-device interface.',
            'That list will change. It will not be edited to look better than it is.',
          ],
          fa: [
            'امروز کار می‌کند: ماژول مرکزی پایدار روشن می‌شود، حسگرهایش را می‌خواند و اتصال بی‌سیم با کلاینت همراه را حفظ می‌کند. در دست کار: بدنه و بودجهٔ توان. ساخته‌نشده: برد چاپی اختصاصی و رابط روی دستگاه.',
            'این فهرست تغییر خواهد کرد. اما ویرایش نمی‌شود تا بهتر از آنچه هست به نظر برسد.',
          ],
        },
      },
    ],
    gallery: [],
  },
];

/** Capabilities safe to render. Unverified entries never reach the page. */
export function publishableCapabilities(project: Project): Capability[] {
  return project.capabilities.filter((c) => c.state !== 'unverified');
}

/** A displayable date, or null. Never guesses, never formats an absent value. */
export function projectDate(project: Project, locale: 'en' | 'fa'): string | null {
  if (project.displayDate) return project.displayDate[locale];
  if (!project.startDate) return null;
  const start = project.startDate.slice(0, 4);
  if (project.endDate) {
    const end = project.endDate.slice(0, 4);
    return start === end ? start : `${start}\u2014${end}`;
  }
  return `${start}\u2014`;
}

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

export function featuredProjects(): Project[] {
  return projects.filter((p) => p.featured).sort((a, b) => a.order - b.order);
}

export function nextProject(slug: string): Project {
  const ordered = [...projects].sort((a, b) => a.order - b.order);
  const index = ordered.findIndex((p) => p.slug === slug);
  return ordered[(index + 1) % ordered.length] as Project;
}
