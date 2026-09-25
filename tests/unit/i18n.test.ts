import { describe, expect, it } from 'vitest';
import { switchLocalePath, localizeDigits, isLocale } from '@/i18n/config';

describe('switchLocalePath', () => {
  it('keeps the logical page when switching locale', () => {
    expect(switchLocalePath('/en/projects/pad-system', 'fa')).toBe('/fa/projects/pad-system');
    expect(switchLocalePath('/fa/blog/some-slug', 'en')).toBe('/en/blog/some-slug');
  });

  it('handles the locale root', () => {
    expect(switchLocalePath('/en', 'fa')).toBe('/fa');
    expect(switchLocalePath('/', 'fa')).toBe('/fa');
  });

  it('prefixes an unprefixed path rather than dropping it', () => {
    expect(switchLocalePath('/projects', 'en')).toBe('/en/projects');
  });
});

describe('localizeDigits', () => {
  it('converts only in Persian', () => {
    expect(localizeDigits('2026', 'fa')).toBe('۲۰۲۶');
    expect(localizeDigits('2026', 'en')).toBe('2026');
  });
});

describe('isLocale', () => {
  it('rejects unknown segments', () => {
    expect(isLocale('en')).toBe(true);
    expect(isLocale('de')).toBe(false);
  });
});
