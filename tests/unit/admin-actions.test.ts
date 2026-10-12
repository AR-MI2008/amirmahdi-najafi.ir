import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  authenticated: vi.fn(),
  save: vi.fn(),
  headers: vi.fn(),
  revalidate: vi.fn(),
}));
vi.mock('@/lib/admin/auth', () => ({ isAdminAuthenticated: mocks.authenticated }));
vi.mock('@/lib/admin/repository', () => ({ saveAdminEntry: mocks.save }));
vi.mock('next/headers', () => ({ headers: mocks.headers }));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidate }));
import { saveAdminContent } from '@/app/admin/content/actions';
const post = {
  slug: 'test',
  draft: true,
  featured: false,
  category: 'development',
  tags: [],
  publishedAt: '2026-10-12',
  title: { fa: 'عنوان', en: 'Title' },
  excerpt: { fa: 'خلاصه', en: 'Summary' },
  blocks: [],
};
function form(data: unknown = post) {
  const f = new FormData();
  f.set('kind', 'post');
  f.set('content', JSON.stringify(data));
  f.set('version', '');
  f.set('originalSlug', '');
  return f;
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.authenticated.mockResolvedValue(true);
  mocks.headers.mockResolvedValue(new Headers({ origin: 'https://admin.example' }));
  vi.stubEnv('ADMIN_ORIGIN', 'https://admin.example');
  vi.stubEnv('NODE_ENV', 'production');
});
afterEach(() => vi.unstubAllEnvs());
it('rejects unauthenticated writes before reading request data', async () => {
  mocks.authenticated.mockResolvedValue(false);
  expect((await saveAdminContent({ ok: false, message: '' }, form())).ok).toBe(false);
  expect(mocks.headers).not.toHaveBeenCalled();
  expect(mocks.save).not.toHaveBeenCalled();
});
it('rejects cross-origin writes even with a spoofed forwarded host', async () => {
  mocks.headers.mockResolvedValue(
    new Headers({ origin: 'https://attacker.example', 'x-forwarded-host': 'attacker.example' }),
  );
  expect((await saveAdminContent({ ok: false, message: '' }, form())).ok).toBe(false);
  expect(mocks.save).not.toHaveBeenCalled();
});
it('enforces a byte limit for multibyte text and rejects tampered schema data', async () => {
  const large = form({ ...post, excerpt: { fa: 'ف'.repeat(125000), en: 'Summary' } });
  expect((await saveAdminContent({ ok: false, message: '' }, large)).message).toContain('حجم');
  expect(
    (await saveAdminContent({ ok: false, message: '' }, form({ ...post, admin: true }))).ok,
  ).toBe(false);
  expect(mocks.save).not.toHaveBeenCalled();
});
it('rejects slug changes on edit and saves valid creates', async () => {
  const edit = form();
  edit.set('version', 'a'.repeat(64));
  edit.set('originalSlug', 'original');
  expect((await saveAdminContent({ ok: false, message: '' }, edit)).ok).toBe(false);
  expect(mocks.save).not.toHaveBeenCalled();
  expect((await saveAdminContent({ ok: false, message: '' }, form())).ok).toBe(true);
  expect(mocks.save).toHaveBeenCalledWith('post', post, null);
});
