import { describe, expect, it } from 'vitest';
import { calendarDateSchema, projectDateSchema } from '@/lib/admin/date-validation';
import { adminProjectSchema } from '@/lib/admin/project-validation';
import { projects } from '@/content/projects';
describe('CMS dates and local media', () => {
  it('accepts leap days and valid months but rejects overflow', () => {
    expect(calendarDateSchema.safeParse('2024-02-29').success).toBe(true);
    for (const date of ['2026-02-29', '2026-04-31', '2026-13-01'])
      expect(calendarDateSchema.safeParse(date).success).toBe(false);
    expect(projectDateSchema.safeParse('2026-10').success).toBe(true);
    expect(projectDateSchema.safeParse('2026-13').success).toBe(false);
  });
  it('rejects protocol-relative, encoded and backslash gallery paths', () => {
    const base = { ...projects[0], gallery: [] };
    expect(adminProjectSchema.safeParse(base).success).toBe(true);
    for (const src of [
      '//evil.example/x.png',
      '/\\evil.example/x.png',
      '/%2e%2e/x.png',
      '/images/../x.png',
    ])
      expect(
        adminProjectSchema.safeParse({
          ...base,
          gallery: [{ src, alt: { fa: 'تصویر', en: 'Image' }, width: 100, height: 100 }],
        }).success,
      ).toBe(false);
  });
});
