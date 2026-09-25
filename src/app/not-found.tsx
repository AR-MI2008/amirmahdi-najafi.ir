import Link from 'next/link';
import { headers } from 'next/headers';
import { defaultLocale, isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { Container } from '@/components/ui/primitives';

export default async function NotFound() {
  const headerList = await headers();
  const raw = headerList.get('x-locale') ?? defaultLocale;
  const locale = isLocale(raw) ? raw : defaultLocale;
  const dict = await getDictionary(locale);

  return (
    <Container className="flex min-h-[70svh] flex-col justify-center py-24">
      <p className="tick">404</p>
      <h1 className="mt-5 max-w-2xl text-[length:var(--text-3xl)] font-medium tracking-[-0.03em]">
        {dict.notFound.title}
      </h1>
      <p className="prose-body mt-4">{dict.notFound.lede}</p>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href={`/${locale}`}
          className="rounded bg-accent px-5 py-3 text-[length:var(--text-sm)] font-medium text-[color:var(--accent-contrast)]"
        >
          {dict.notFound.home}
        </Link>
        <Link
          href={`/${locale}/projects`}
          className="rounded border border-line px-5 py-3 text-[length:var(--text-sm)]"
        >
          {dict.notFound.projects}
        </Link>
      </div>
    </Container>
  );
}
