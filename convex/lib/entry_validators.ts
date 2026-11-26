import { v } from 'convex/values';

export const entryStatus = v.union(v.literal('draft'), v.literal('completed'));
export const impactCategory = v.union(
  v.literal('technical'),
  v.literal('business'),
  v.literal('people'),
);
export const impactStatus = v.union(
  v.literal('pending'),
  v.literal('known'),
  v.literal('not_measurable'),
);

// Persisted drafts always have owned organization context, but journal fields
// may be incomplete. Completion's required fields are enforced by task 3.2.
export const entryContentFields = {
  date: v.optional(v.string()),
  task: v.optional(v.string()),
  whatIDid: v.optional(v.string()),
  whoItHelped: v.optional(v.string()),
  companyImpact: v.optional(v.string()),
  impactCategories: v.array(impactCategory),
  impactStatus,
  // Free text supports measurements such as "Saved 2 hours per week".
  impactMetrics: v.optional(v.string()),
  notesAndPraise: v.optional(v.string()),
};

export const entryFields = {
  companyId: v.id('companies'),
  projectId: v.id('projects'),
  ...entryContentFields,
  status: entryStatus,
};

export const entryIdArgs = { entryId: v.id('entries') };
