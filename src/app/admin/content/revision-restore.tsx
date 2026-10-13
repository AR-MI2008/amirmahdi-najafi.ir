'use client';
import { useActionState } from 'react';
import { restoreAdminContent } from './actions';
export function RevisionRestore({
  kind,
  slug,
  version,
  revisions,
}: {
  kind: 'post' | 'project';
  slug: string;
  version: string;
  revisions: { id: number; createdAt: string }[];
}) {
  const [state, action, pending] = useActionState(restoreAdminContent, { ok: false, message: '' });
  if (!revisions.length) return null;
  return (
    <details>
      <summary>تاریخچه و بازگردانی</summary>
      <p>
        بازگردانی، نسخهٔ قدیمی را به پیش‌نویس تبدیل می‌کند و آن را از نمایش عمومی خارج می‌کند. برای
        انتشار دوباره باید آن را بررسی کنید.
      </p>
      <form action={action}>
        <input type="hidden" name="kind" value={kind} />
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="version" value={version} />
        <label htmlFor="revision">نسخهٔ قبلی</label>
        <select id="revision" name="revision" disabled={pending || state.ok}>
          {revisions.map((r) => (
            <option key={r.id} value={r.id}>
              نسخه {r.id} — {r.createdAt} UTC
            </option>
          ))}
        </select>
        <button disabled={pending || state.ok} type="submit">
          {pending ? 'در حال بازگردانی…' : 'بازگردانی به پیش‌نویس'}
        </button>
        {state.message && <p role={state.ok ? 'status' : 'alert'}>{state.message}</p>}
      </form>
    </details>
  );
}
