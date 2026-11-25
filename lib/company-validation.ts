import { z } from 'zod';

function isCalendarDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000'))
    return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

const optionalDate = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined)
  .refine((value) => !value || isCalendarDate(value), {
    message: 'Enter a valid date as YYYY-MM-DD.',
  });

export const companySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Enter a company name.')
      .max(200, 'Use 200 characters or fewer.'),
    jobTitle: z
      .string()
      .trim()
      .max(200, 'Use 200 characters or fewer.')
      .optional()
      .transform((value) => value || undefined),
    startDate: optionalDate,
    endDate: optionalDate,
  })
  .refine(
    ({ startDate, endDate }) => !startDate || !endDate || endDate >= startDate,
    {
      path: ['endDate'],
      message: 'End date must be on or after the start date.',
    },
  );

export type CompanyFormValues = z.input<typeof companySchema>;
export type CompanyValues = z.output<typeof companySchema>;
