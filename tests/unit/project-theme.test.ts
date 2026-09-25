import { describe, expect, it } from 'vitest';
import { projects } from '@/content/projects';
import type { ProjectPalette } from '@/content/projects';

/**
 * Contrast is the whole reason the dual-palette architecture exists, so it is
 * asserted rather than eyeballed. A future palette tweak that looks fine to
 * the person making it will fail here instead of shipping.
 *
 * WCAG 2.1: 4.5:1 for normal text, 3:1 for non-text graphics (1.4.11).
 */

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

const TEXT_KEYS = ['foreground', 'muted', 'accent'] as const;
const HEX = /^#[0-9a-f]{6}$/;

function assertPalette(slug: string, mode: 'dark' | 'light', p: ProjectPalette) {
  for (const key of ['background', 'surface', 'accent', 'accentSecondary', 'foreground', 'muted'] as const) {
    expect(p[key], `${slug}/${mode}.${key} must be a 6-digit lowercase hex`).toMatch(HEX);
  }

  for (const key of TEXT_KEYS) {
    for (const bg of ['background', 'surface'] as const) {
      const ratio = contrastRatio(p[key], p[bg]);
      expect(
        ratio,
        `${slug}/${mode}: ${key} (${p[key]}) on ${bg} (${p[bg]}) is ${ratio.toFixed(2)}:1, needs 4.5`,
      ).toBeGreaterThanOrEqual(4.5);
    }
  }

  // accentSecondary is decorative only — gradients and motif strokes.
  for (const bg of ['background', 'surface'] as const) {
    const ratio = contrastRatio(p.accentSecondary, p[bg]);
    expect(
      ratio,
      `${slug}/${mode}: accentSecondary on ${bg} is ${ratio.toFixed(2)}:1, needs 3.0`,
    ).toBeGreaterThanOrEqual(3);
  }
}

describe('project themes', () => {
  it.each(projects.map((p) => [p.slug, p] as const))('%s defines both palettes', (slug, project) => {
    expect(project.theme.dark, `${slug} has no dark palette`).toBeDefined();
    expect(project.theme.light, `${slug} has no light palette`).toBeDefined();
  });

  it.each(projects.map((p) => [p.slug, p] as const))('%s passes contrast in dark mode', (slug, project) => {
    assertPalette(slug, 'dark', project.theme.dark);
  });

  it.each(projects.map((p) => [p.slug, p] as const))('%s passes contrast in light mode', (slug, project) => {
    assertPalette(slug, 'light', project.theme.light);
  });

  it('keeps each project visually distinct rather than reusing one accent', () => {
    const darkAccents = new Set(projects.map((p) => p.theme.dark.accent));
    expect(darkAccents.size).toBe(projects.length);
  });

  it('does not simply invert: light is a designed palette, not a swap', () => {
    for (const p of projects) {
      // A pure inversion would make the light background equal to the dark
      // foreground. Each light palette should be its own set of values.
      expect(p.theme.light.background).not.toBe(p.theme.dark.foreground);
      expect(p.theme.light.accent).not.toBe(p.theme.dark.accent);
      // Light backgrounds must actually be light, dark ones dark.
      expect(luminance(p.theme.light.background)).toBeGreaterThan(0.5);
      expect(luminance(p.theme.dark.background)).toBeLessThan(0.1);
    }
  });

  it('keeps the light glow more restrained than the dark one', () => {
    for (const p of projects) {
      expect(p.theme.glowLight).toBeLessThanOrEqual(p.theme.glow);
    }
  });
});
