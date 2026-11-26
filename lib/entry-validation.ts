import { z } from 'zod';
import { isCalendarDate } from './company-validation';

const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Use ${max} characters or fewer.`)
    .optional()
    .transform((value) => value || undefined);
export const entryDraftSchema = z.object({
  date: text(10).refine(
    (value) => !value || isCalendarDate(value),
    'Choose a valid date.',
  ),
  task: text(200),
  whatIDid: text(20000),
  whoItHelped: text(4000),
  companyImpact: text(20000),
  impactCategories: z
    .array(z.enum(['technical', 'business', 'people']))
    .max(3)
    .default([])
    .refine(
      (values) => new Set(values).size === values.length,
      'Select each category only once.',
    ),
  impactStatus: z
    .enum(['pending', 'known', 'not_measurable'])
    .default('pending'),
  impactMetrics: text(4000),
  notesAndPraise: text(20000),
});
export const entryCompletedSchema = entryDraftSchema.superRefine(
  (values, ctx) => {
    for (const [field, message] of [
      ['date', 'Choose a work date.'],
      ['task', 'Enter a task title.'],
      ['whatIDid', 'Describe what you did.'],
    ] as const) {
      if (!values[field])
        ctx.addIssue({ code: 'custom', path: [field], message });
    }
  },
);
export type EntryFormValues = z.input<typeof entryDraftSchema>;
export type EntryContent = z.output<typeof entryDraftSchema>;
export const EMPTY_ENTRY: EntryFormValues = {
  date: '',
  task: '',
  whatIDid: '',
  whoItHelped: '',
  companyImpact: '',
  impactCategories: [],
  impactStatus: 'pending',
  impactMetrics: '',
  notesAndPraise: '',
};

export function entryFingerprint(values: EntryFormValues) {
  return JSON.stringify(entryDraftSchema.parse(values));
}
