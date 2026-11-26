import {
  paginationOptsValidator,
  paginationResultValidator,
} from 'convex/server';
import { ConvexError, v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireUserId } from './lib/auth';
import { requireOwnedCompany } from './lib/organization';
import {
  requireNoCompanyEntries,
  requireNoProjectEntries,
} from './lib/entries';
import { ensureGeneralProject } from './lib/general_projects';
import { companyFields, companyIdArgs } from './lib/organization_validators';
import {
  companySchema,
  type CompanyFormValues,
} from '../lib/company-validation';
import schema from './schema';

const companyDoc = schema.doc('companies');

function validateCompany(input: CompanyFormValues) {
  const result = companySchema.safeParse(input);
  if (!result.success) {
    throw new ConvexError({
      code: 'VALIDATION_ERROR',
      message: result.error.issues[0].message,
    });
  }
  return result.data;
}

export const list = query({
  args: { paginationOpts: paginationOptsValidator },
  returns: paginationResultValidator(companyDoc),
  handler: async (ctx, { paginationOpts }) => {
    const userId = await requireUserId(ctx);
    return ctx.db
      .query('companies')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .order('desc')
      .paginate(paginationOpts);
  },
});

export const get = query({
  args: companyIdArgs,
  returns: v.union(companyDoc, v.null()),
  handler: async (ctx, { companyId }) => {
    const userId = await requireUserId(ctx);
    const company = await ctx.db.get('companies', companyId);
    // Missing and foreign records are indistinguishable, including after deletion.
    return company?.userId === userId ? company : null;
  },
});

export const create = mutation({
  args: companyFields,
  returns: v.id('companies'),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const values = validateCompany(args);
    const now = Date.now();
    const companyId = await ctx.db.insert('companies', {
      ...values,
      userId,
      createdAt: now,
      updatedAt: now,
    });
    await ensureGeneralProject(ctx, { _id: companyId, userId });
    return companyId;
  },
});

export const update = mutation({
  args: { ...companyIdArgs, ...companyFields },
  returns: v.null(),
  handler: async (ctx, { companyId, ...input }) => {
    await requireOwnedCompany(ctx, companyId);
    const values = validateCompany(input);
    // This is a full form replacement: undefined removes a cleared optional field.
    await ctx.db.patch('companies', companyId, {
      name: values.name,
      jobTitle: values.jobTitle,
      startDate: values.startDate,
      endDate: values.endDate,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const remove = mutation({
  args: companyIdArgs,
  returns: v.null(),
  handler: async (ctx, { companyId }) => {
    const company = await requireOwnedCompany(ctx, companyId);
    const project = await ctx.db
      .query('projects')
      .withIndex('by_company_general', (q) =>
        q.eq('companyId', companyId).eq('isGeneral', false),
      )
      .first();
    if (project) {
      throw new ConvexError({
        code: 'HAS_RELATED_RECORDS',
        message: 'Companies with named projects cannot be deleted.',
      });
    }
    await requireNoCompanyEntries(ctx, companyId);
    // The built-in category can only be removed with its otherwise empty parent.
    const general = await ctx.db
      .query('projects')
      .withIndex('by_company_general', (q) =>
        q.eq('companyId', companyId).eq('isGeneral', true),
      )
      .unique();
    if (general) {
      if (general.userId !== company.userId)
        throw new ConvexError({
          code: 'NOT_FOUND',
          message: 'This record is unavailable.',
        });
      // Also guard the category's ID if a corrupt entry's companyId disagrees.
      await requireNoProjectEntries(ctx, general._id);
      await ctx.db.delete('projects', general._id);
    }
    await ctx.db.delete('companies', companyId);
    return null;
  },
});
