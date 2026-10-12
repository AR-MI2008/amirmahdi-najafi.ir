import { afterEach, describe, expect, it, vi } from 'vitest';
import { validAdminOrigin } from '@/lib/admin/request-security';
import { adminPostSchema } from '@/lib/admin/post-validation';
afterEach(() => vi.unstubAllEnvs());
describe('CMS request boundary', () => {
  it('requires configured origin in production and ignores spoofed forwarded host', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('ADMIN_ORIGIN', 'https://admin.example.com');
    expect(
      validAdminOrigin(
        new Headers({
          origin: 'https://evil.example.com',
          host: 'admin.example.com',
          'x-forwarded-host': 'evil.example.com',
        }),
      ),
    ).toBe(false);
    expect(
      validAdminOrigin(new Headers({ origin: 'https://admin.example.com', host: 'internal:3000' })),
    ).toBe(true);
    expect(validAdminOrigin(new Headers({ origin: 'http://admin.example.com' }))).toBe(false);
  });
  it('fails closed without production configuration', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('ADMIN_ORIGIN', '');
    expect(
      validAdminOrigin(new Headers({ origin: 'https://example.com', host: 'example.com' })),
    ).toBe(false);
  });
  it('rejects malformed dates and unexpected fields', () => {
    const post = {
      slug: 'example',
      draft: true,
      featured: false,
      category: 'development',
      tags: [],
      publishedAt: '2026-02-30',
      title: { fa: 'عنوان', en: 'Title' },
      excerpt: { fa: 'خلاصه', en: 'Summary' },
      blocks: [],
    };
    expect(adminPostSchema.safeParse(post).success).toBe(false);
    expect(
      adminPostSchema.safeParse({ ...post, publishedAt: '2026-02-28', admin: true }).success,
    ).toBe(false);
    expect(adminPostSchema.safeParse({ ...post, publishedAt: '2026-02-28' }).success).toBe(true);
  });
});
