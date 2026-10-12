'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { isAdminAuthenticated } from '@/lib/admin/auth';
import { saveAdminEntry } from '@/lib/admin/repository';

export type SaveResult = { ok: boolean; message: string };

export async function saveAdminJson(_previous: SaveResult, form: FormData): Promise<SaveResult> {
  if (!(await isAdminAuthenticated())) return { ok: false, message: 'دسترسی غیرمجاز' };
  const headersList = await headers();
  const origin = headersList.get('origin');
  const host = headersList.get('x-forwarded-host') ?? headersList.get('host');
  if (!origin || !host) return { ok: false, message: 'درخواست نامعتبر' };
  try {
    const parsed = new URL(origin);
    if (parsed.host !== host || (process.env.NODE_ENV === 'production' && parsed.protocol !== 'https:')) {
      return { ok: false, message: 'مبدأ درخواست نامعتبر' };
    }
    const kind = form.get('kind');
    const source = form.get('json');
    if ((kind !== 'post' && kind !== 'project') || typeof source !== 'string' || source.length > 250000) {
      return { ok: false, message: 'نوع یا حجم محتوا نامعتبر است' };
    }
    saveAdminEntry(kind, JSON.parse(source));
    revalidatePath('/fa', 'layout');
    revalidatePath('/en', 'layout');
    return { ok: true, message: 'در دیتابیس ذخیره شد؛ اتصال نمایش عمومی هنوز فعال نیست.' };
  } catch {
    return { ok: false, message: 'اعتبارسنجی یا ذخیره‌سازی ناموفق بود' };
  }
}
