import { z } from 'zod';
import { isGeneralProjectName } from '../constants/organization';

export const projectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Enter a project name.')
    .max(200, 'Use 200 characters or fewer.')
    .refine(
      (name) => !isGeneralProjectName(name),
      'General / Adhoc is built in. Choose a different project name.',
    ),
  description: z
    .string()
    .trim()
    .max(4000, 'Use 4,000 characters or fewer.')
    .optional()
    .transform((value) => value || undefined),
  status: z.enum(['active', 'archived']),
});

export type ProjectFormValues = z.input<typeof projectSchema>;
export type ProjectValues = z.output<typeof projectSchema>;
