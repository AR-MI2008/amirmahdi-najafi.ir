import { z } from 'zod';

/** Rejects CR/LF so form input can never inject email headers. */
const singleLine = (max: number) =>
  z
    .string()
    .trim()
    .min(1)
    .max(max)
    .refine((v) => !/[\r\n]/.test(v), { message: 'invalid' });

export const contactSchema = z.object({
  name: singleLine(80),
  email: z.string().trim().email().max(160),
  subject: singleLine(140),
  projectType: z.string().trim().max(60).optional(),
  message: z.string().trim().min(20).max(4000),
  /** Honeypot. Must arrive empty. */
  website: z.string().max(0).optional().default(''),
  /** Client render timestamp; sub-second submissions are bots. */
  renderedAt: z.coerce.number().int().nonnegative(),
  turnstileToken: z.string().max(2048).optional(),
});

export type ContactInput = z.infer<typeof contactSchema>;

/** Escape everything that reaches an email body. No raw user HTML, ever. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
