import { z } from 'zod';
import { calendarDateSchema } from './date-validation';

const localized = z.object({
  fa: z.string().trim().min(1).max(20000),
  en: z.string().trim().min(1).max(20000),
}).strict();

const localizedShort = z.object({
  fa: z.string().trim().min(1).max(240),
  en: z.string().trim().min(1).max(240),
}).strict();

const textBlock = z.discriminatedUnion('type', [
  z.object({ type: z.literal('h2'), text: localized }).strict(),
  z.object({ type: z.literal('p'), text: localized }).strict(),
  z.object({ type: z.literal('note'), text: localized }).strict(),
  z.object({
    type: z.literal('code'),
    lang: z.string().trim().min(1).max(40).regex(/^[a-z0-9+#._-]+$/i),
    code: z.string().max(50000),
  }).strict(),
]);

/** Exact shape of the existing src/content/posts.ts Post model. */
export const adminPostSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120),
  draft: z.boolean(),
  featured: z.boolean(),
  category: z.enum(['development', 'ai', 'security', 'engineering', 'projects', 'behind-the-build']),
  tags: z.array(z.string().trim().min(1).max(60)).max(20),
  publishedAt: calendarDateSchema,
  updatedAt: calendarDateSchema.optional(),
  title: localizedShort,
  excerpt: localized,
  blocks: z.array(textBlock).max(200),
}).strict();

export type AdminPostInput = z.infer<typeof adminPostSchema>;
