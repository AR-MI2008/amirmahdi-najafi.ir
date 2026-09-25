import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Every icon the app declares must exist on disk.
 *
 * The manifest and metadata previously referenced four files that were never
 * created. Nothing failed — the browser just 404ed quietly and installed apps
 * got a blank square. A build-time assertion is the only thing that catches
 * this class of bug before a user does.
 */

const PUBLIC = join(process.cwd(), 'public');

const declared = [
  'favicon.svg',
  'favicon.ico',
  'apple-touch-icon.png',
  'icon-192.png',
  'icon-512.png',
  'icon-maskable-512.png',
  'site.webmanifest',
];

describe('declared static assets', () => {
  it.each(declared)('%s exists and is not empty', (file) => {
    const path = join(PUBLIC, file);
    expect(existsSync(path), `public/${file} is referenced but missing`).toBe(true);
    expect(readFileSync(path).byteLength).toBeGreaterThan(0);
  });

  it('manifest references only files that exist', () => {
    const manifest = JSON.parse(readFileSync(join(PUBLIC, 'site.webmanifest'), 'utf8')) as {
      icons: { src: string; purpose?: string }[];
    };
    for (const icon of manifest.icons) {
      const rel = icon.src.replace(/^\//, '');
      expect(existsSync(join(PUBLIC, rel)), `manifest points at missing ${icon.src}`).toBe(true);
    }
  });

  it('ships a maskable icon so Android does not crop the monogram', () => {
    const manifest = JSON.parse(readFileSync(join(PUBLIC, 'site.webmanifest'), 'utf8')) as {
      icons: { purpose?: string }[];
    };
    expect(manifest.icons.some((i) => i.purpose === 'maskable')).toBe(true);
  });
});
