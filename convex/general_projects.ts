import { v } from 'convex/values';
import { internalMutation, internalQuery } from './_generated/server';
import { internal } from './_generated/api';
import { ensureGeneralProject } from './lib/general_projects';
import { GENERAL_PROJECT_NAME } from '../constants/organization';

// Admin-only, bounded, restartable migration for companies created before 2.4.
export const backfill = internalMutation({
  args: { cursor: v.union(v.string(), v.null()) },
  returns: v.object({
    processed: v.number(),
    done: v.boolean(),
    nextCursor: v.string(),
  }),
  handler: async (
    ctx,
    { cursor },
  ): Promise<{ processed: number; done: boolean; nextCursor: string }> => {
    const page = await ctx.db
      .query('companies')
      .paginate({ cursor, numItems: 100 });
    for (const company of page.page) await ensureGeneralProject(ctx, company);
    if (!page.isDone)
      await ctx.scheduler.runAfter(0, internal.general_projects.backfill, {
        cursor: page.continueCursor,
      });
    return {
      processed: page.page.length,
      done: page.isDone,
      nextCursor: page.continueCursor,
    };
  },
});

// Return counts only: migration verification must not log company/journal data.
export const audit = internalQuery({
  args: { cursor: v.union(v.string(), v.null()) },
  returns: v.object({
    checked: v.number(),
    missing: v.number(),
    duplicates: v.number(),
    invalid: v.number(),
    done: v.boolean(),
    nextCursor: v.string(),
  }),
  handler: async (ctx, { cursor }) => {
    const page = await ctx.db
      .query('companies')
      .paginate({ cursor, numItems: 100 });
    let missing = 0;
    let duplicates = 0;
    let invalid = 0;
    for (const company of page.page) {
      const categories = await ctx.db
        .query('projects')
        .withIndex('by_company_general', (q) =>
          q.eq('companyId', company._id).eq('isGeneral', true),
        )
        .take(2);
      if (categories.length === 0) missing++;
      if (categories.length > 1) duplicates++;
      if (
        categories.some(
          (project) =>
            project.userId !== company.userId ||
            project.name !== GENERAL_PROJECT_NAME ||
            project.status !== 'active',
        )
      )
        invalid++;
    }
    return {
      checked: page.page.length,
      missing,
      duplicates,
      invalid,
      done: page.isDone,
      nextCursor: page.continueCursor,
    };
  },
});
