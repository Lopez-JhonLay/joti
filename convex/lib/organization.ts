import { ConvexError } from 'convex/values';
import type { Id } from '../_generated/dataModel';
import type { QueryCtx } from '../_generated/server';
import { requireOwnedRecord } from './auth';

type OrganizationContext = Pick<QueryCtx, 'auth' | 'runQuery' | 'db'>;

export async function requireOwnedCompany(
  ctx: OrganizationContext,
  companyId: Id<'companies'>,
) {
  return requireOwnedRecord(ctx, await ctx.db.get('companies', companyId));
}

export async function requireOwnedProject(
  ctx: OrganizationContext,
  projectId: Id<'projects'>,
) {
  const project = await requireOwnedRecord(
    ctx,
    await ctx.db.get('projects', projectId),
  );
  // An owned project must also have a live parent owned by the same caller.
  await requireOwnedCompany(ctx, project.companyId);
  return project;
}

// Use before associating an entry with a company/project pair. Archived
// projects remain valid historical relationships; selection rules come later.
export async function requireCompanyProject(
  ctx: OrganizationContext,
  companyId: Id<'companies'>,
  projectId: Id<'projects'>,
) {
  const company = await requireOwnedCompany(ctx, companyId);
  const project = await requireOwnedProject(ctx, projectId);
  if (project.companyId !== company._id) {
    throw new ConvexError({
      code: 'VALIDATION_ERROR',
      message: 'The project must belong to the selected company.',
    });
  }
  return { company, project };
}
