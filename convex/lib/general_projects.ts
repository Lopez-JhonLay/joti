import { ConvexError } from 'convex/values';
import type { Doc } from '../_generated/dataModel';
import type { MutationCtx } from '../_generated/server';
import { GENERAL_PROJECT_NAME } from '../../constants/organization';

export async function ensureGeneralProject(
  ctx: Pick<MutationCtx, 'db'>,
  company: Pick<Doc<'companies'>, '_id' | 'userId'>,
) {
  // This indexed range read and insert run in one Convex transaction. Competing
  // callers conflict and retry, then reuse the committed category's ID.
  const existing = await ctx.db
    .query('projects')
    .withIndex('by_company_general', (q) =>
      q.eq('companyId', company._id).eq('isGeneral', true),
    )
    .unique();
  if (existing) {
    if (existing.userId !== company.userId)
      throw new ConvexError({
        code: 'NOT_FOUND',
        message: 'This record is unavailable.',
      });
    if (
      existing.name !== GENERAL_PROJECT_NAME ||
      existing.status !== 'active'
    ) {
      await ctx.db.patch('projects', existing._id, {
        name: GENERAL_PROJECT_NAME,
        status: 'active',
        updatedAt: Date.now(),
      });
    }
    return existing._id;
  }
  const now = Date.now();
  return ctx.db.insert('projects', {
    userId: company.userId,
    companyId: company._id,
    name: GENERAL_PROJECT_NAME,
    description: 'Work that does not belong to a named project.',
    status: 'active',
    isGeneral: true,
    createdAt: now,
    updatedAt: now,
  });
}
