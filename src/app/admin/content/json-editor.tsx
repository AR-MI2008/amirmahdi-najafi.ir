'use client';

import { useActionState } from 'react';
import { saveAdminJson, type SaveResult } from './actions';

const initial: SaveResult = { ok: false, message: '' };

export function AdminJsonEditor() {
  const [state, action, pending] = useActionState(saveAdminJson, initial);
  return (
    <form action={action} style={{ display: 'grid', gap: 16 }}>
      <label htmlFor="kind">نوع محتوا</label>
      <select id="kind" name="kind" required style={{ color: 'var(--fg)', background: 'var(--surface)', padding: 12, border: '1px solid var(--border)' }}>
        <option value="post">مقاله</option>
        <option value="project">پروژه</option>
      </select>
      <label htmlFor="json">JSON کامل مطابق ساختار محتوای فعلی سایت</label>
      <textarea id="json" name="json" required rows={18} spellCheck={false} dir="ltr"
        style={{ width: '100%', fontFamily: 'monospace', background: 'var(--surface)', color: 'var(--fg)', padding: 16, border: '1px solid var(--border)' }} />
      <button type="submit" disabled={pending} style={{ padding: 14, background: 'var(--accent)', color: 'var(--accent-contrast)' }}>
        {pending ? 'در حال ذخیره...' : 'اعتبارسنجی و ذخیره'}
      </button>
      {state.message && <p role="status" style={{ color: state.ok ? 'var(--success)' : 'var(--danger)' }}>{state.message}</p>}
    </form>
  );
}
