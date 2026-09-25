import type { L10n } from '@/i18n/config';

export type Service = {
  id: string;
  title: L10n;
  body: L10n;
  includes: L10n<string[]>;
};

/** No fixed pricing is published. Every engagement is scoped in conversation. */
export const services: Service[] = [
  {
    id: 'web-development',
    title: { en: 'Custom web development', fa: 'توسعهٔ وب اختصاصی' },
    body: {
      en: 'Responsive marketing sites, catalogues and content platforms, built to be edited by the people who own them.',
      fa: 'سایت‌های معرفی، کاتالوگ و پلتفرم محتوا؛ ساخته‌شده برای اینکه صاحبانشان بتوانند خودشان ویرایش کنند.',
    },
    includes: {
      en: ['Design and build', 'Content management setup', 'WordPress and WooCommerce where it fits', 'Performance and SEO groundwork'],
      fa: ['طراحی و پیاده‌سازی', 'راه‌اندازی مدیریت محتوا', 'وردپرس و ووکامرس در جای مناسب', 'زیرساخت کارایی و سئو'],
    },
  },
  {
    id: 'web-applications',
    title: { en: 'Full-stack web applications', fa: 'اپلیکیشن‌های وب فول‌استک' },
    body: {
      en: 'Products with accounts, permissions, real data and state — front end and back end as one system rather than two contracts.',
      fa: 'محصولاتی با حساب کاربری، سطح دسترسی، دادهٔ واقعی و وضعیت؛ فرانت و بک‌اند به‌عنوان یک سیستم، نه دو قرارداد.',
    },
    includes: {
      en: ['Next.js and TypeScript front end', 'Django or Node back end', 'PostgreSQL schema and migrations', 'Deployment and handover'],
      fa: ['فرانت‌اند Next.js و TypeScript', 'بک‌اند Django یا Node', 'اسکیما و مهاجرت PostgreSQL', 'استقرار و تحویل'],
    },
  },
  {
    id: 'ai',
    title: { en: 'AI solutions & integrations', fa: 'راهکارها و یکپارچه‌سازی هوش مصنوعی' },
    body: {
      en: 'Putting existing models to work inside a product: retrieval over your own content, classification, drafting and assistive interfaces. I integrate and fine-tune around models — I do not train foundation models.',
      fa: 'به کار گرفتن مدل‌های موجود درون محصول: بازیابی روی محتوای خودتان، دسته‌بندی، پیش‌نویس‌سازی و رابط‌های کمکی. من حول مدل‌ها یکپارچه‌سازی می‌کنم — مدل پایه آموزش نمی‌دهم.',
    },
    includes: {
      en: ['Retrieval over private content', 'Structured extraction and classification', 'Assistive product features', 'Cost and latency budgeting'],
      fa: ['بازیابی روی محتوای اختصاصی', 'استخراج ساختاریافته و دسته‌بندی', 'قابلیت‌های کمکی درون محصول', 'بودجه‌بندی هزینه و تأخیر'],
    },
  },
  {
    id: 'automation',
    title: { en: 'Automation & internal tools', fa: 'اتوماسیون و ابزارهای داخلی' },
    body: {
      en: 'Dashboards, bots and pipelines for the work your team currently does by hand twice a week.',
      fa: 'داشبورد، ربات و خط‌لوله برای کاری که تیم شما الان هفته‌ای دو بار دستی انجام می‌دهد.',
    },
    includes: {
      en: ['Operational dashboards', 'Telegram and messaging bots', 'Scheduled jobs and data pipelines', 'Third-party integrations'],
      fa: ['داشبورد عملیاتی', 'ربات تلگرام و پیام‌رسان', 'کارهای زمان‌بندی‌شده و خط‌لولهٔ داده', 'یکپارچه‌سازی با سرویس‌های بیرونی'],
    },
  },
  {
    id: 'backend',
    title: { en: 'Backend development', fa: 'توسعهٔ بک‌اند' },
    body: {
      en: 'APIs, background processing, data models and the reliability work that decides whether a product survives its second year.',
      fa: 'API، پردازش پس‌زمینه، مدل داده و همان کار پایداری که تعیین می‌کند محصول سال دومش را رد می‌کند یا نه.',
    },
    includes: {
      en: ['REST API design', 'Queues and scheduled work', 'Database design and indexing', 'Rate limiting, validation, auditing'],
      fa: ['طراحی REST API', 'صف و کارهای زمان‌بندی‌شده', 'طراحی و ایندکس‌گذاری پایگاه داده', 'محدودیت نرخ، اعتبارسنجی و ممیزی'],
    },
  },
  {
    id: 'prototyping',
    title: { en: 'Product prototyping', fa: 'ساخت نمونهٔ اولیهٔ محصول' },
    body: {
      en: 'Turning a concept into something clickable and running, fast enough that you learn from it before committing to a full build.',
      fa: 'تبدیل یک ایده به چیزی قابل‌کلیک و در حال اجرا، آن‌قدر سریع که پیش از تعهد به ساخت کامل از آن یاد بگیرید.',
    },
    includes: {
      en: ['Scoping and technical feasibility', 'Working MVP', 'Honest assessment of what it would take to productionise'],
      fa: ['تعیین دامنه و امکان‌سنجی فنی', 'MVP کارکردی', 'ارزیابی صادقانه از هزینهٔ عملیاتی کردن آن'],
    },
  },
];
