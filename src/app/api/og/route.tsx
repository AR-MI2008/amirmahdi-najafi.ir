import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const runtime = 'nodejs';
export const revalidate = 86400;

const MAX = 120;

/** Optional. Drop a TTF beside the woff2 files to render Persian OG titles. */
async function loadFont(file: string): Promise<ArrayBuffer | null> {
  try {
    const buffer = await readFile(join(process.cwd(), 'public', 'fonts', file));
    return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = (searchParams.get('title') ?? 'Amirmahdi Najafi').slice(0, MAX);
  const subtitle = (searchParams.get('subtitle') ?? '').slice(0, MAX);
  const accent = /^#[0-9a-fA-F]{6}$/.test(searchParams.get('accent') ?? '')
    ? (searchParams.get('accent') as string)
    : '#42d9ff';
  const locale = searchParams.get('locale') === 'fa' ? 'fa' : 'en';

  const latin = await loadFont('Geist-Regular.ttf');
  const persian = await loadFont('Vazirmatn-Regular.ttf');
  const fonts = [
    latin ? { name: 'Geist', data: latin, weight: 400 as const, style: 'normal' as const } : null,
    persian
      ? { name: 'Vazirmatn', data: persian, weight: 400 as const, style: 'normal' as const }
      : null,
  ].filter(Boolean) as { name: string; data: ArrayBuffer; weight: 400; style: 'normal' }[];

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#05070A',
          padding: 72,
          color: '#F4F7FA',
          fontFamily: locale === 'fa' && persian ? 'Vazirmatn' : 'Geist',
          direction: locale === 'fa' ? 'rtl' : 'ltr',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 44,
              height: 44,
              border: `1px solid ${accent}`,
              color: accent,
              fontSize: 18,
            }}
          >
            AN
          </div>
          <div style={{ fontSize: 22, color: '#8C98A6' }}>amirmahdi-najafi.ir</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ fontSize: title.length > 48 ? 58 : 74, lineHeight: 1.08, letterSpacing: -2 }}>
            {title}
          </div>
          {subtitle ? <div style={{ fontSize: 30, color: accent }}>{subtitle}</div> : null}
        </div>

        <div style={{ display: 'flex', height: 4, width: 220, background: accent }} />
      </div>
    ),
    { width: 1200, height: 630, ...(fonts.length > 0 ? { fonts } : {}) },
  );
}
