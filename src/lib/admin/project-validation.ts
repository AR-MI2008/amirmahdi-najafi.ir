import { z } from 'zod';

const l10n = z.object({
  fa: z.string().trim().min(1).max(10000),
  en: z.string().trim().min(1).max(10000),
}).strict();

const palette = z.object({
  background: z.string().regex(/^#[0-9a-f]{6}$/i),
  surface: z.string().regex(/^#[0-9a-f]{6}$/i),
  accent: z.string().regex(/^#[0-9a-f]{6}$/i),
  accentSecondary: z.string().regex(/^#[0-9a-f]{6}$/i),
  foreground: z.string().regex(/^#[0-9a-f]{6}$/i),
  muted: z.string().regex(/^#[0-9a-f]{6}$/i),
}).strict();

const safeUrl = z.string().url().max(2048).refine((value) => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch { return false; }
});

export const adminProjectSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120),
  name: l10n,
  category: l10n,
  role: l10n,
  startDate: z.string().regex(/^\d{4}-\d{2}(?:-\d{2})?$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}(?:-\d{2})?$/).optional(),
  displayDate: l10n.optional(),
  status: z.enum(['live', 'in-development', 'prototype', 'delivered']),
  featured: z.boolean(),
  order: z.number().int().min(0).max(100000),
  summary: l10n,
  intro: l10n,
  tech: z.array(z.string().trim().min(1).max(100)).max(50),
  links: z.array(z.object({ label: l10n, href: safeUrl }).strict()).max(30),
  canonicalUrl: safeUrl.optional(),
  theme: z.object({
    motif: z.enum(['radar', 'topology', 'flow', 'trace', 'catalogue']),
    glow: z.number().min(0).max(1),
    glowLight: z.number().min(0).max(1),
    dark: palette,
    light: palette,
  }).strict(),
  capabilities: z.array(z.object({
    state: z.enum(['implemented', 'in-progress', 'planned', 'unverified']),
    label: l10n,
  }).strict()).max(100),
  sections: z.array(z.object({
    id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100),
    title: l10n,
    body: z.object({
      fa: z.array(z.string().min(1).max(10000)).max(100),
      en: z.array(z.string().min(1).max(10000)).max(100),
    }).strict(),
  }).strict()).max(100),
  gallery: z.array(z.object({
    src: z.string().startsWith('/').max(500).refine((value) => !value.startsWith('//') && !value.includes('..')),
    alt: l10n,
    width: z.number().int().positive().max(20000),
    height: z.number().int().positive().max(20000),
  }).strict()).max(100),
}).strict();

export type AdminProjectInput = z.infer<typeof adminProjectSchema>;
