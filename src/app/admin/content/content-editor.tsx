'use client';
import { useActionState, useState } from 'react';
import { z } from 'zod';
import { adminPostSchema } from '@/lib/admin/post-validation';
import { adminProjectSchema } from '@/lib/admin/project-validation';
import { saveAdminContent } from './actions';

const labels: Record<string, string> = {
  slug: 'شناسهٔ لاتین',
  draft: 'پیش‌نویس',
  featured: 'ویژه',
  category: 'دسته‌بندی',
  tags: 'برچسب‌ها',
  publishedAt: 'تاریخ انتشار',
  updatedAt: 'تاریخ به‌روزرسانی',
  title: 'عنوان',
  excerpt: 'خلاصه',
  blocks: 'بخش‌های مقاله',
  type: 'نوع',
  text: 'متن',
  lang: 'زبان کد',
  code: 'کد',
  name: 'نام',
  role: 'نقش',
  startDate: 'تاریخ شروع',
  endDate: 'تاریخ پایان',
  displayDate: 'تاریخ نمایشی',
  status: 'وضعیت',
  order: 'ترتیب',
  summary: 'خلاصه',
  intro: 'معرفی',
  tech: 'فناوری‌ها',
  links: 'پیوندها',
  label: 'عنوان',
  href: 'نشانی',
  canonicalUrl: 'نشانی اصلی',
  theme: 'ظاهر پروژه',
  motif: 'الگو',
  glow: 'درخشش تیره',
  glowLight: 'درخشش روشن',
  dark: 'حالت تیره',
  light: 'حالت روشن',
  background: 'پس‌زمینه',
  surface: 'سطح',
  accent: 'رنگ اصلی',
  accentSecondary: 'رنگ دوم',
  foreground: 'متن',
  muted: 'متن کم‌رنگ',
  capabilities: 'قابلیت‌ها',
  state: 'وضعیت',
  sections: 'بخش‌ها',
  id: 'شناسه',
  body: 'پاراگراف‌ها',
  gallery: 'تصاویر',
  src: 'مسیر تصویر',
  alt: 'متن جایگزین',
  width: 'عرض',
  height: 'ارتفاع',
  fa: 'فارسی',
  en: 'انگلیسی',
  development: 'توسعه',
  ai: 'هوش مصنوعی',
  security: 'امنیت',
  engineering: 'مهندسی',
  projects: 'پروژه‌ها',
  'behind-the-build': 'پشت صحنه',
  live: 'فعال',
  'in-development': 'در حال توسعه',
  prototype: 'نمونه اولیه',
  delivered: 'تحویل‌شده',
  implemented: 'پیاده‌شده',
  'in-progress': 'در حال انجام',
  planned: 'برنامه‌ریزی‌شده',
  unverified: 'تأییدنشده',
  h2: 'تیتر',
  p: 'پاراگراف',
  note: 'یادداشت',
  radar: 'رادار',
  topology: 'توپولوژی',
  flow: 'جریان',
  trace: 'ردیابی',
  catalogue: 'فهرست',
};
function unwrap(schema: z.ZodTypeAny): z.ZodTypeAny {
  if (schema instanceof z.ZodOptional || schema instanceof z.ZodDefault)
    return unwrap(schema._def.innerType);
  if (schema instanceof z.ZodEffects) return unwrap(schema._def.schema);
  return schema;
}
function empty(schema: z.ZodTypeAny): unknown {
  if (schema.isOptional()) return undefined;
  const s = unwrap(schema);
  if (s instanceof z.ZodObject)
    return Object.fromEntries(
      Object.entries(s.shape).map(([k, v]) => [k, empty(v as z.ZodTypeAny)]),
    );
  if (s instanceof z.ZodArray) return [];
  if (s instanceof z.ZodBoolean) return false;
  if (s instanceof z.ZodNumber) return 0;
  if (s instanceof z.ZodEnum) return s.options[0];
  if (s instanceof z.ZodLiteral) return s.value;
  if (s instanceof z.ZodDiscriminatedUnion) return empty(s.options[0]);
  return '';
}
function Field({
  schema,
  value,
  onChange,
  path,
  errors,
  locked = false,
  optionalEnabled = false,
}: {
  schema: z.ZodTypeAny;
  value: unknown;
  onChange: (v: unknown) => void;
  path: string;
  errors: Record<string, string>;
  locked?: boolean;
  optionalEnabled?: boolean;
}) {
  const s = unwrap(schema),
    key = path.split('.').at(-1)!,
    label = path
      ? (labels[key] ?? (Number.isInteger(Number(key)) ? `مورد ${Number(key) + 1}` : key))
      : 'اطلاعات محتوا';
  const id = 'cms-' + path,
    error = errors[path];
  if (schema.isOptional() && s instanceof z.ZodObject && !optionalEnabled) {
    return (
      <fieldset className="cms-group">
        <legend>{label} (اختیاری)</legend>
        <label>
          <input
            type="checkbox"
            checked={value !== undefined}
            onChange={(e) => onChange(e.target.checked ? empty(s) : undefined)}
          />{' '}
          فعال
        </label>
        {value !== undefined && (
          <Field
            schema={s}
            value={value}
            onChange={onChange}
            path={path}
            errors={errors}
            optionalEnabled
          />
        )}
      </fieldset>
    );
  }
  if (s instanceof z.ZodObject)
    return (
      <fieldset className="cms-group">
        <legend>{label}</legend>
        {Object.entries(s.shape).map(([k, v]) => (
          <Field
            key={k}
            schema={v as z.ZodTypeAny}
            value={(value as Record<string, unknown> | undefined)?.[k]}
            onChange={(next) => onChange({ ...((value as object) ?? {}), [k]: next })}
            path={path ? `${path}.${k}` : k}
            errors={errors}
            locked={locked}
          />
        ))}
      </fieldset>
    );
  if (s instanceof z.ZodArray) {
    const items = (value ?? []) as unknown[];
    return (
      <fieldset className="cms-group">
        <legend>{label}</legend>
        {items.map((item, i) => (
          <div key={i} className="cms-item">
            <Field
              schema={s.element}
              value={item}
              onChange={(next) => onChange(items.map((v, n) => (n === i ? next : v)))}
              path={`${path}.${i}`}
              errors={errors}
            />
            <div className="cms-buttons">
              <button type="button" onClick={() => onChange(items.filter((_, n) => n !== i))}>
                حذف مورد {i + 1}
              </button>
              <button
                type="button"
                disabled={i === 0}
                onClick={() => {
                  const next = [...items];
                  [next[i - 1], next[i]] = [next[i], next[i - 1]];
                  onChange(next);
                }}
              >
                انتقال به بالا
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          disabled={items.length >= (s._def.maxLength?.value ?? 200)}
          onClick={() => onChange([...items, empty(s.element)])}
        >
          افزودن به {label}
        </button>
        {error && <p role="alert">{error}</p>}
      </fieldset>
    );
  }
  if (s instanceof z.ZodDiscriminatedUnion) {
    const current = (value ?? empty(s)) as Record<string, unknown>;
    const selected =
      s.options.find(
        (o: z.ZodObject<z.ZodRawShape>) =>
          (o.shape.type as z.ZodLiteral<string>).value === current.type,
      ) ?? s.options[0];
    return (
      <fieldset className="cms-group">
        <legend>بخش مقاله</legend>
        <label>
          نوع بخش
          <select
            value={String(current.type)}
            onChange={(e) =>
              onChange(
                empty(
                  s.options.find(
                    (o: z.ZodObject<z.ZodRawShape>) =>
                      (o.shape.type as z.ZodLiteral<string>).value === e.target.value,
                  )!,
                ),
              )
            }
          >
            {s.options.map((o: z.ZodObject<z.ZodRawShape>) => (
              <option
                key={(o.shape.type as z.ZodLiteral<string>).value}
                value={(o.shape.type as z.ZodLiteral<string>).value}
              >
                {labels[(o.shape.type as z.ZodLiteral<string>).value]}
              </option>
            ))}
          </select>
        </label>
        {Object.entries(selected.shape)
          .filter(([k]) => k !== 'type')
          .map(([k, v]) => (
            <Field
              key={k}
              schema={v as z.ZodTypeAny}
              value={current[k]}
              onChange={(next) => onChange({ ...current, [k]: next })}
              path={`${path}.${k}`}
              errors={errors}
            />
          ))}
      </fieldset>
    );
  }
  const props = {
    id,
    'aria-invalid': Boolean(error),
    'aria-describedby': error ? `${id}-error` : undefined,
    disabled: locked && key === 'slug',
  };
  return (
    <div className="cms-field">
      <label htmlFor={id}>
        {label}
        {schema.isOptional() ? ' (اختیاری)' : ''}
      </label>
      {s instanceof z.ZodBoolean ? (
        <input
          {...props}
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
        />
      ) : s instanceof z.ZodEnum ? (
        <select
          {...props}
          value={String(value ?? s.options[0])}
          onChange={(e) => onChange(e.target.value)}
        >
          {s.options.map((v: string) => (
            <option key={v} value={v}>
              {labels[v] ?? v}
            </option>
          ))}
        </select>
      ) : s instanceof z.ZodNumber ? (
        <input
          {...props}
          type="number"
          step={s.isInt ? 1 : 0.01}
          value={value === undefined ? '' : String(value)}
          onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
        />
      ) : (
        <textarea
          {...props}
          dir={
            key === 'en' ||
            ['slug', 'src', 'href', 'code', 'canonicalUrl', 'lang', 'id'].includes(key)
              ? 'ltr'
              : 'auto'
          }
          rows={['fa', 'en', 'code'].includes(key) ? 3 : 1}
          value={String(value ?? '')}
          onChange={(e) =>
            onChange(e.target.value === '' && schema.isOptional() ? undefined : e.target.value)
          }
          spellCheck={key !== 'code'}
        />
      )}{' '}
      {error && (
        <p id={`${id}-error`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
export function ContentEditor({
  kind,
  initial,
  version = '',
  originalSlug = '',
}: {
  kind: 'post' | 'project';
  initial?: unknown;
  version?: string;
  originalSlug?: string;
}) {
  const schema = kind === 'post' ? adminPostSchema : adminProjectSchema;
  const [value, setValue] = useState<unknown>(() => {
    if (initial) return initial;
    const draft = empty(schema) as Record<string, unknown>;
    if (kind === 'post') draft.draft = true;
    else
      draft.theme = {
        motif: 'radar',
        glow: 0.2,
        glowLight: 0.12,
        dark: {
          background: '#05070a',
          surface: '#0d131a',
          accent: '#42d9ff',
          accentSecondary: '#00b8e6',
          foreground: '#f4f7fa',
          muted: '#8c98a6',
        },
        light: {
          background: '#f7f9fb',
          surface: '#ffffff',
          accent: '#0071a0',
          accentSecondary: '#00546f',
          foreground: '#081018',
          muted: '#5e6875',
        },
      };
    return draft;
  });
  const [state, action, pending] = useActionState(saveAdminContent, { ok: false, message: '' });
  return (
    <form action={action} className="cms-editor">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="content" value={JSON.stringify(value)} />
      <input type="hidden" name="version" value={version} />
      <input type="hidden" name="originalSlug" value={originalSlug} />
      <p>
        فیلدهای فارسی و انگلیسی را تکمیل کنید. تاریخ‌ها میلادی و به صورت YYYY-MM-DD هستند؛ تاریخ
        پروژه می‌تواند YYYY-MM باشد. تصاویر از مسیر محلی مثل /images/example.webp انتخاب می‌شوند.
      </p>
      <fieldset disabled={pending || state.ok}>
        <Field
          schema={schema}
          value={value}
          onChange={setValue}
          path=""
          errors={state.errors ?? {}}
          locked={Boolean(version)}
        />
        <button type="submit">
          {pending ? 'در حال ذخیره…' : version ? 'ذخیرهٔ تغییرات' : 'ایجاد محتوا'}
        </button>
      </fieldset>
      {state.message && <p role={state.ok ? 'status' : 'alert'}>{state.message}</p>}
    </form>
  );
}
