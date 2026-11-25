import { v } from 'convex/values';

// Date-only employment values use YYYY-MM-DD, without a timezone conversion.
// Required names and date ranges also need business validation in mutations.
export const companyFields = {
  name: v.string(),
  jobTitle: v.optional(v.string()),
  startDate: v.optional(v.string()),
  endDate: v.optional(v.string()),
};

export const projectStatus = v.union(
  v.literal('active'),
  v.literal('archived'),
);

export const projectFields = {
  companyId: v.id('companies'),
  name: v.string(),
  description: v.optional(v.string()),
  status: projectStatus,
};

// Client-editable payloads deliberately omit ownership, timestamps, and the
// built-in category flag. Mutations must derive those values on the server.
export const companyInput = v.object(companyFields);
export const projectInput = v.object(projectFields);
export const companyIdArgs = { companyId: v.id('companies') };
export const projectIdArgs = { projectId: v.id('projects') };
export const companyProjectArgs = { ...companyIdArgs, ...projectIdArgs };
