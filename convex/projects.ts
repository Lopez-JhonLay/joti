import {
  paginationOptsValidator,
  paginationResultValidator,
} from 'convex/server';
import { ConvexError, v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireUserId } from './lib/auth';
import { requireOwnedCompany, requireOwnedProject } from './lib/organization';
import { ensureGeneralProject } from './lib/general_projects';
import {
  companyIdArgs,
  projectIdArgs,
  projectFields,
  projectStatus,
} from './lib/organization_validators';
import {
  projectSchema,
  type ProjectFormValues,
} from '../lib/project-validation';
import schema from './schema';
import type { Doc } from './_generated/dataModel';
import { GENERAL_PROJECT_NAME } from '../constants/organization';

function validateProject(input: ProjectFormValues) {
  const result = projectSchema.safeParse(input);
  if (!result.success)
    throw new ConvexError({
      code: 'VALIDATION_ERROR',
      message: result.error.issues[0].message,
    });
  return result.data;
}

function requireEditableProject(project: Doc<'projects'>) {
  if (project.isGeneral)
    throw new ConvexError({
      code: 'VALIDATION_ERROR',
      message: 'The built-in category cannot be edited or archived.',
    });
}

export const list = query({
  args: {
    ...companyIdArgs,
    status: v.optional(projectStatus),
    namedOnly: v.optional(v.boolean()),
    paginationOpts: paginationOptsValidator,
  },
  returns: paginationResultValidator(schema.doc('projects')),
  handler: async (ctx, { companyId, status, namedOnly, paginationOpts }) => {
    const company = await requireOwnedCompany(ctx, companyId);
    const projects = ctx.db
      .query('projects')
      .withIndex('by_user_company_status', (q) => {
        const ownedCompany = q
          .eq('userId', company.userId)
          .eq('companyId', companyId);
        return status ? ownedCompany.eq('status', status) : ownedCompany;
      })
      .order('desc');
    return (
      namedOnly
        ? projects.filter((q) => q.eq(q.field('isGeneral'), false))
        : projects
    ).paginate(paginationOpts);
  },
});

export const get = query({
  args: projectIdArgs,
  returns: v.union(
    v.object({
      project: schema.doc('projects'),
      company: schema.doc('companies'),
    }),
    v.null(),
  ),
  handler: async (ctx, { projectId }) => {
    const userId = await requireUserId(ctx);
    const project = await ctx.db.get('projects', projectId);
    if (!project || project.userId !== userId) return null;
    const company = await ctx.db.get('companies', project.companyId);
    // Foreign, missing, and broken parent relationships reveal no private data.
    if (!company || company.userId !== userId) return null;
    return { project, company };
  },
});

export const general = query({
  args: companyIdArgs,
  returns: v.union(schema.doc('projects'), v.null()),
  handler: async (ctx, { companyId }) => {
    const company = await requireOwnedCompany(ctx, companyId);
    const project = await ctx.db
      .query('projects')
      .withIndex('by_company_general', (q) =>
        q.eq('companyId', companyId).eq('isGeneral', true),
      )
      .unique();
    return project &&
      project.userId === company.userId &&
      project.status === 'active' &&
      project.name === GENERAL_PROJECT_NAME
      ? project
      : null;
  },
});

export const ensureGeneral = mutation({
  args: companyIdArgs,
  returns: v.id('projects'),
  handler: async (ctx, { companyId }) =>
    ensureGeneralProject(ctx, await requireOwnedCompany(ctx, companyId)),
});

export const create = mutation({
  args: {
    ...companyIdArgs,
    name: projectFields.name,
    description: projectFields.description,
  },
  returns: v.id('projects'),
  handler: async (ctx, { companyId, ...input }) => {
    const company = await requireOwnedCompany(ctx, companyId);
    const values = validateProject({ ...input, status: 'active' });
    const now = Date.now();
    return ctx.db.insert('projects', {
      ...values,
      companyId,
      userId: company.userId,
      isGeneral: false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  // Company is immutable: editing a project cannot move historical work to a
  // different employer. Ownership, built-in flags, and timestamps stay server-owned.
  args: {
    ...projectIdArgs,
    name: projectFields.name,
    description: projectFields.description,
    status: projectStatus,
  },
  returns: v.null(),
  handler: async (ctx, { projectId, ...input }) => {
    const project = await requireOwnedProject(ctx, projectId);
    requireEditableProject(project);
    const values = validateProject(input);
    await ctx.db.patch('projects', projectId, {
      name: values.name,
      description: values.description,
      status: values.status,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const setStatus = mutation({
  args: { ...projectIdArgs, status: projectStatus },
  returns: v.null(),
  handler: async (ctx, { projectId, status }) => {
    const project = await requireOwnedProject(ctx, projectId);
    requireEditableProject(project);
    if (project.status !== status)
      await ctx.db.patch('projects', projectId, {
        status,
        updatedAt: Date.now(),
      });
    return null;
  },
});

// No permanent-delete endpoint is exposed. Archive preserves the project and
// its relationships; entry-aware deletion can be added only after task 3.1.
