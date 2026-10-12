'use server';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { isAdminAuthenticated } from '@/lib/admin/auth';
import { saveAdminEntry } from '@/lib/admin/repository';
import { validAdminOrigin } from '@/lib/admin/request-security';
import { adminPostSchema } from '@/lib/admin/post-validation';
import { adminProjectSchema } from '@/lib/admin/project-validation';
export type SaveResult = { ok: boolean; message: string; errors?: Record<string, string> };
export async function saveAdminContent(_previous: SaveResult, form: FormData): Promise<SaveResult> {
  if (!(await isAdminAuthenticated()))
    return { ok: false, message: 'دسترسی غیرمجاز؛ دوباره وارد شوید.' };
  if (!validAdminOrigin(await headers()))
    return { ok: false, message: 'مبدأ درخواست نامعتبر است.' };
  const kind = form.get('kind');
  const source = form.get('content');
  const version = form.get('version');
  const slug = form.get('originalSlug');
  if (
    (kind !== 'post' && kind !== 'project') ||
    typeof source !== 'string' ||
    new TextEncoder().encode(source).length > 250000 ||
    typeof version !== 'string' ||
    typeof slug !== 'string'
  ) {
    return { ok: false, message: 'نوع یا حجم محتوا نامعتبر است.' };
  }
  try {
    const parsed = (kind === 'post' ? adminPostSchema : adminProjectSchema).safeParse(
      JSON.parse(source),
    );
    if (!parsed.success)
      return {
        ok: false,
        message: 'فیلدهای مشخص‌شده را اصلاح کنید.',
        errors: Object.fromEntries(
          parsed.error.issues.map((i) => [
            i.path.join('.'),
            'مقدار نامعتبر یا خارج از محدوده است.',
          ]),
        ),
      };
    if (version && parsed.data.slug !== slug)
      return { ok: false, message: 'شناسهٔ رکورد در ویرایش قابل تغییر نیست.' };
    saveAdminEntry(kind, parsed.data, version || null);
    revalidatePath('/admin/content');
    return {
      ok: true,
      message:
        'ذخیره شد. نمایش در سایت عمومی هنوز فعال نیست؛ برای ویرایش بعدی رکورد را دوباره باز کنید.',
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error && error.message === 'CONFLICT'
          ? 'این شناسه قبلاً ثبت شده یا رکورد تغییر کرده است. فهرست را تازه کنید و دوباره باز کنید.'
          : 'ذخیره‌سازی ناموفق بود؛ اطلاعات فرم حفظ شده است.',
    };
  }
}
