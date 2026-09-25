import type { L10n, Locale } from '@/i18n/config';

/* ==========================================================================
   Writing. Mirrors payload/collections/posts.ts.
   Draft posts are excluded from listings, sitemap and indexing.
   ========================================================================== */

export type Block =
  | { type: 'h2'; text: L10n }
  | { type: 'p'; text: L10n }
  | { type: 'code'; lang: string; code: string }
  | { type: 'note'; text: L10n };

export type Post = {
  slug: string;
  draft: boolean;
  featured: boolean;
  category: 'development' | 'ai' | 'security' | 'engineering' | 'projects' | 'behind-the-build';
  tags: string[];
  publishedAt: string;
  updatedAt?: string;
  title: L10n;
  excerpt: L10n;
  blocks: Block[];
};

export const categoryLabels: Record<Post['category'], L10n> = {
  development: { en: 'Development', fa: 'توسعه' },
  ai: { en: 'AI', fa: 'هوش مصنوعی' },
  security: { en: 'Security', fa: 'امنیت' },
  engineering: { en: 'Engineering', fa: 'مهندسی' },
  projects: { en: 'Projects', fa: 'پروژه‌ها' },
  'behind-the-build': { en: 'Behind the build', fa: 'پشت ساخت' },
};

export const posts: Post[] = [
  {
    slug: 'fetching-user-supplied-urls-safely',
    draft: false,
    featured: true,
    category: 'security',
    tags: ['Web Security', 'Python', 'Django'],
    publishedAt: '2025-11-18',
    title: {
      en: 'Fetching user-supplied URLs without building an SSRF engine',
      fa: 'واکشی آدرس‌های ورودی کاربر، بدون ساختن یک موتور SSRF',
    },
    excerpt: {
      en: 'Any tool that accepts a URL and fetches it is one careless line away from being an internal network scanner. Here is the layer I built for WebGuard.',
      fa: 'هر ابزاری که آدرس می‌گیرد و آن را واکشی می‌کند، یک خط بی‌دقتی با تبدیل شدن به اسکنر شبکهٔ داخلی فاصله دارد. این لایه‌ای است که برای وب‌گارد ساختم.',
    },
    blocks: [
      {
        type: 'p',
        text: {
          en: 'WebGuard exists to check other people’s websites, which means its core operation is: take a string from an anonymous visitor and make an HTTP request to it. That is the textbook setup for server-side request forgery. If you do it naively, you have not built a security tool — you have built a free proxy into your own private network.',
          fa: 'وب‌گارد برای بررسی وب‌سایت دیگران ساخته شده، یعنی عملیات اصلی‌اش این است: رشته‌ای از یک بازدیدکنندهٔ ناشناس بگیر و به آن درخواست HTTP بزن. این دقیقاً چیدمان کتاب‌درسی SSRF است. اگر ساده‌انگارانه انجامش دهید، ابزار امنیتی نساخته‌اید؛ یک پروکسی رایگان به شبکهٔ خصوصی خودتان ساخته‌اید.',
        },
      },
      { type: 'h2', text: { en: 'The naive version is wrong in four ways', fa: 'نسخهٔ ساده‌انگارانه از چهار جهت غلط است' } },
      {
        type: 'p',
        text: {
          en: 'Blocking obvious hostnames like localhost is where most attempts stop. It fails immediately. An attacker can point a public DNS record at 127.0.0.1, or use a decimal-encoded address, or send you to a public URL that redirects to an internal one, or win the race between your validation lookup and the library’s own lookup.',
          fa: 'مسدود کردن نام‌های آشکار مثل localhost جایی است که بیشتر تلاش‌ها متوقف می‌شوند و بلافاصله شکست می‌خورد. مهاجم می‌تواند یک رکورد DNS عمومی را به 127.0.0.1 اشاره دهد، از آدرس اعشاری‌کدشده استفاده کند، شما را به آدرسی عمومی بفرستد که به آدرسی داخلی ریدایرکت می‌شود، یا در رقابت میان lookup اعتبارسنجی شما و lookup خود کتابخانه برنده شود.',
        },
      },
      { type: 'h2', text: { en: 'What actually works', fa: 'آنچه واقعاً کار می‌کند' } },
      {
        type: 'p',
        text: {
          en: 'Resolve the hostname yourself. Check every returned address against the reserved ranges — loopback, private, link-local, unique-local, multicast, and the IPv6 equivalents including IPv4-mapped forms. Then connect to the specific IP you validated, sending the original hostname in the Host header and in SNI. That closes the DNS rebinding window, because the address the socket uses is the address you checked.',
          fa: 'نام میزبان را خودتان resolve کنید. هر آدرس بازگشتی را در برابر بازه‌های رزروشده بررسی کنید — loopback، خصوصی، link-local، unique-local، multicast و معادل‌های IPv6 از جمله شکل‌های IPv4-mapped. سپس دقیقاً به همان IP اعتبارسنجی‌شده وصل شوید و نام میزبان اصلی را در هدر Host و در SNI بفرستید. این پنجرهٔ DNS rebinding را می‌بندد، چون آدرسی که سوکت استفاده می‌کند همان آدرسی است که بررسی کرده‌اید.',
        },
      },
      {
        type: 'code',
        lang: 'python',
        code: `import ipaddress, socket

BLOCKED = ("private", "loopback", "link_local", "reserved", "multicast")

def is_public(addr: str) -> bool:
    ip = ipaddress.ip_address(addr)
    if ip.version == 6 and ip.ipv4_mapped:
        ip = ip.ipv4_mapped
    return not (
        ip.is_private or ip.is_loopback or ip.is_link_local
        or ip.is_reserved or ip.is_multicast or ip.is_unspecified
    )

def resolve_public(host: str, port: int) -> list[str]:
    infos = socket.getaddrinfo(host, port, proto=socket.IPPROTO_TCP)
    addrs = {info[4][0] for info in infos}
    if not addrs or not all(is_public(a) for a in addrs):
        raise ValueError("target resolves to a non-public address")
    return sorted(addrs)`,
      },
      {
        type: 'p',
        text: {
          en: 'Note that the check requires every resolved address to be public, not just one. A hostname that returns both a public and a private address is not a valid target; it is an attempt.',
          fa: 'توجه کنید که بررسی، عمومی بودن همهٔ آدرس‌های resolve شده را می‌طلبد، نه فقط یکی. نام میزبانی که هم آدرس عمومی و هم خصوصی برمی‌گرداند هدف معتبر نیست؛ یک تلاش است.',
        },
      },
      { type: 'h2', text: { en: 'Redirects are the part people forget', fa: 'ریدایرکت‌ها همان بخشی‌اند که فراموش می‌شود' } },
      {
        type: 'p',
        text: {
          en: 'Turn off automatic redirect following in your HTTP client and handle each hop yourself, running the full validation again every time. A validated first request that follows three redirects into your metadata service is the same vulnerability with extra steps. Cap the hop count while you are there.',
          fa: 'دنبال کردن خودکار ریدایرکت را در کلاینت HTTP خاموش کنید و هر پرش را خودتان مدیریت کنید و هر بار اعتبارسنجی کامل را دوباره اجرا کنید. درخواست اول اعتبارسنجی‌شده‌ای که سه ریدایرکت بعد به سرویس متادیتای شما می‌رسد، همان آسیب‌پذیری با چند قدم اضافه است. همان‌جا تعداد پرش را هم محدود کنید.',
        },
      },
      {
        type: 'note',
        text: {
          en: 'I wrote the tests for this layer before writing any scanner that depends on it. That ordering was not discipline for its own sake — it is the only way to know a refactor six months later has not quietly reopened the hole.',
          fa: 'تست‌های این لایه را پیش از نوشتن هر اسکنری که به آن وابسته است نوشتم. این ترتیب انضباط برای انضباط نبود؛ تنها راه اطمینان از این است که بازنویسی شش ماه بعد، بی‌سروصدا این حفره را دوباره باز نکرده باشد.',
        },
      },
    ],
  },
  {
    slug: 'building-for-iranian-network-conditions',
    draft: false,
    featured: false,
    category: 'engineering',
    tags: ['Next.js', 'Web Security', 'Product Development'],
    publishedAt: '2025-09-30',
    updatedAt: '2026-01-14',
    title: {
      en: 'Every frontend default assumes a network I do not have',
      fa: 'هر پیش‌فرض فرانت‌اند شبکه‌ای را فرض می‌گیرد که من ندارم',
    },
    excerpt: {
      en: 'Google Fonts, a CDN-hosted analytics script, an external icon set. Three lines that work everywhere and fail here. What I do instead.',
      fa: 'گوگل فونت، اسکریپت تحلیل روی CDN، یک مجموعهٔ آیکون بیرونی. سه خط که همه‌جا کار می‌کنند و اینجا شکست می‌خورند. من چه می‌کنم.',
    },
    blocks: [
      {
        type: 'p',
        text: {
          en: 'Most frontend advice is written by people whose requests resolve. Mine often do not. Building for users inside Iran means CDN endpoints get blocked, third-party origins time out rather than failing fast, and a font that loads in a millisecond in your test environment holds the page for thirty seconds in production.',
          fa: 'بیشتر توصیه‌های فرانت‌اند را کسانی نوشته‌اند که درخواست‌هایشان به مقصد می‌رسد. درخواست‌های من اغلب نمی‌رسند. ساختن برای کاربران داخل ایران یعنی نقاط CDN مسدود می‌شوند، مبدأهای شخص ثالث به‌جای شکست سریع تایم‌اوت می‌شوند، و فونتی که در محیط تست شما در یک میلی‌ثانیه بارگذاری می‌شود، در محیط عملیاتی سی ثانیه صفحه را نگه می‌دارد.',
        },
      },
      { type: 'h2', text: { en: 'Rule one: no origin you do not control', fa: 'قاعدهٔ اول: هیچ مبدأیی که کنترلش نمی‌کنید' } },
      {
        type: 'p',
        text: {
          en: 'Fonts are self-hosted. Icons are inline SVG in the bundle. Analytics, if any, is first-party or absent. This is not purity — it is the difference between a page that renders and a page that hangs. It also has a pleasant side effect: the content security policy gets much shorter, and a short CSP is a CSP you can actually reason about.',
          fa: 'فونت‌ها روی سرور خودمان میزبانی می‌شوند. آیکون‌ها SVG درون‌خطی در باندل‌اند. تحلیل، اگر باشد، first-party است یا اصلاً نیست. این وسواس نیست؛ تفاوت میان صفحه‌ای که رندر می‌شود و صفحه‌ای که هنگ می‌کند است. یک اثر جانبی خوشایند هم دارد: سیاست امنیت محتوا خیلی کوتاه‌تر می‌شود، و CSP کوتاه همان CSP‌ای است که واقعاً می‌شود دربارهٔ آن فکر کرد.',
        },
      },
      { type: 'h2', text: { en: 'Rule two: degrade, never block', fa: 'قاعدهٔ دوم: افت کن، هرگز مسدود نکن' } },
      {
        type: 'p',
        text: {
          en: 'Anything that talks to an external API — a GitHub repository list, a map tile, a webhook — runs on the server, behind a short timeout, wrapped so that a failure returns an empty result instead of an exception. The section then renders nothing rather than rendering an error. A visitor should never learn about my infrastructure problems.',
          fa: 'هر چیزی که با API بیرونی حرف می‌زند — فهرست مخازن گیت‌هاب، کاشی نقشه، وب‌هوک — روی سرور و پشت یک تایم‌اوت کوتاه اجرا می‌شود و طوری پیچیده شده که شکست، نتیجهٔ خالی برگرداند نه استثنا. آن بخش سپس هیچ‌چیز رندر نمی‌کند، به‌جای اینکه خطا رندر کند. بازدیدکننده هرگز نباید از مشکلات زیرساخت من باخبر شود.',
        },
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `export async function safeFetch<T>(
  url: string,
  init: RequestInit & { next?: { revalidate: number } },
  fallback: T,
): Promise<T> {
  try {
    const res = await fetch(url, { ...init, signal: AbortSignal.timeout(4000) });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}`,
      },
      { type: 'h2', text: { en: 'Rule three: the Persian layout is not a mirror', fa: 'قاعدهٔ سوم: چیدمان فارسی، آینه نیست' } },
      {
        type: 'p',
        text: {
          en: 'Setting dir="rtl" flips the boxes and stops there. Persian needs different line height, no letter-spacing, a typeface with real Persian metrics, and numerals chosen per context — Persian digits in prose, Latin digits in code and URLs. Test the Persian pages separately or you will ship a mirrored English site.',
          fa: 'گذاشتن dir="rtl" جعبه‌ها را برمی‌گرداند و همان‌جا تمام می‌شود. فارسی به ارتفاع خط متفاوت، نبودِ فاصلهٔ حروف، قلمی با متریک واقعی فارسی و اعداد انتخاب‌شده بر حسب زمینه نیاز دارد — رقم فارسی در متن، رقم لاتین در کد و آدرس. صفحه‌های فارسی را جدا تست کنید وگرنه یک سایت انگلیسیِ آینه‌شده منتشر می‌کنید.',
        },
      },
    ],
  },
];

export function publishedPosts(): Post[] {
  return posts
    .filter((p) => !p.draft)
    .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
}

export function getPost(slug: string): Post | undefined {
  return posts.find((p) => p.slug === slug && !p.draft);
}

/** ~200 wpm English, ~150 wpm Persian. */
export function readingTime(post: Post, locale: Locale): number {
  const words = post.blocks
    .map((b) => (b.type === 'code' ? b.code : b.text[locale]))
    .join(' ')
    .split(/\s+/).length;
  return Math.max(1, Math.round(words / (locale === 'fa' ? 150 : 200)));
}

export function adjacentPosts(slug: string): { prev?: Post; next?: Post } {
  const list = publishedPosts();
  const i = list.findIndex((p) => p.slug === slug);
  if (i === -1) return {};
  return { prev: list[i + 1], next: list[i - 1] };
}
