import { describe, expect, it } from 'vitest';
import { negotiateLocale } from '@/proxy';
import { isLocale, switchLocalePath, locales } from '@/i18n/config';

/**
 * Locale negotiation is owned by exactly one layer (src/proxy.ts). These tests
 * pin the behaviour that next.config.mjs used to fight over.
 */

describe('negotiateLocale', () => {
  it('sends Persian-preferring browsers to fa', () => {
    expect(negotiateLocale('fa-IR,fa;q=0.9,en;q=0.8')).toBe('fa');
    expect(negotiateLocale('fa')).toBe('fa');
    expect(negotiateLocale('fa-AF')).toBe('fa');
  });

  it('sends everyone else to en', () => {
    expect(negotiateLocale('en-GB,en;q=0.9')).toBe('en');
    expect(negotiateLocale('de-DE,de;q=0.9')).toBe('en');
    expect(negotiateLocale(null)).toBe('en');
    expect(negotiateLocale('')).toBe('en');
  });

  it('respects quality values rather than header order', () => {
    expect(negotiateLocale('en;q=0.3,fa;q=0.9')).toBe('fa');
    expect(negotiateLocale('fa;q=0.2,en;q=0.8')).toBe('en');
  });

  it('ignores a language offered at q=0', () => {
    expect(negotiateLocale('fa;q=0,en;q=0.5')).toBe('en');
  });

  it('does not crash on malformed headers', () => {
    for (const header of [';;;', 'fa;q=abc', ',,,', '*', 'en;q=', '   ']) {
      expect(locales as readonly string[]).toContain(negotiateLocale(header));
    }
  });
});

describe('malformed locales', () => {
  it('rejects anything that is not exactly en or fa', () => {
    for (const value of ['de', 'xx', 'EN', 'en-US', 'fa-IR', '', 'admin', '..']) {
      expect(isLocale(value), `${value} was accepted as a locale`).toBe(false);
    }
    expect(isLocale('en')).toBe(true);
    expect(isLocale('fa')).toBe(true);
  });
});

describe('switchLocalePath', () => {
  it('keeps the same logical page when switching language', () => {
    expect(switchLocalePath('/en/projects/pad-system', 'fa')).toBe('/fa/projects/pad-system');
    expect(switchLocalePath('/fa/blog/some-post', 'en')).toBe('/en/blog/some-post');
  });

  it('handles the locale root and the bare root', () => {
    expect(switchLocalePath('/en', 'fa')).toBe('/fa');
    expect(switchLocalePath('/', 'fa')).toBe('/fa');
  });
});
