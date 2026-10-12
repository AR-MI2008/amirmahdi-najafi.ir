import { z } from 'zod';

/**
 * Validates the envelope for CMS writes. The complete project/post-specific
 * schema will be applied before any record is persisted.
 */
export const localizedTextSchema = z.object({
  fa: z.string().trim().min(1).max(240),
  en: z.string().trim().min(1).max(240),
}).strict();

export const cmsEntryEnvelopeSchema = z.object({
  kind: z.enum(['project', 'post', 'page']),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120),
  status: z.enum(['draft', 'published']),
  title: localizedTextSchema,
}).strict();

export type CmsEntryEnvelope = z.infer<typeof cmsEntryEnvelopeSchema>;
