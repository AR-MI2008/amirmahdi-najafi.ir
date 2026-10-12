import { z } from 'zod';
export const calendarDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  });
export const projectDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}(?:-\d{2})?$/)
  .refine(
    (value) => calendarDateSchema.safeParse(value.length === 7 ? `${value}-01` : value).success,
  );
