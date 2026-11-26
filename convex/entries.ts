import {
  paginationOptsValidator,
  paginationResultValidator,
} from 'convex/server';
import { ConvexError, v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { MutationCtx } from './_generated/server';
import type { Doc, Id } from './_generated/dataModel';
import schema from './schema';
import { requireUserId } from './lib/auth';
import { requireCompanyProject, requireOwnedProject } from './lib/organization';
import {
  INITIAL_ENTRY_REVISION,
  nextEntryRevision,
  requireOwnedEntry,
} from './lib/entries';
import { entryContentFields, entryIdArgs } from './lib/entry_validators';
import {
  entryCompletedSchema,
  entryDraftSchema,
  EMPTY_ENTRY,
  type EntryFormValues,
} from '../lib/entry-validation';

function validate(input: EntryFormValues, completed = false) {
  const parsed = (
    completed ? entryCompletedSchema : entryDraftSchema
  ).safeParse({ ...EMPTY_ENTRY, ...input });
  if (!parsed.success)
    throw new ConvexError({
      code: 'VALIDATION_ERROR',
      message: parsed.error.issues[0].message,
    });
  return parsed.data;
}
function requestKey(key: string) {
  if (key.length < 16 || key.length > 128)
    throw new ConvexError({
      code: 'VALIDATION_ERROR',
      message: 'Invalid save request. Reopen the editor.',
    });
}
function notAvailable(): never {
  throw new ConvexError({
    code: 'NOT_FOUND',
    message: 'This record is unavailable.',
  });
}
export const get = query({
  args: entryIdArgs,
  returns: v.union(
    v.object({
      entry: schema.doc('entries'),
      company: schema.doc('companies'),
      project: schema.doc('projects'),
    }),
    v.null(),
  ),
  handler: async (ctx, { entryId }) => {
    await requireUserId(ctx);
    try {
      const entry = await requireOwnedEntry(ctx, entryId);
      if (entry.deletedAt !== undefined) return null;
      const { company, project } = await requireCompanyProject(
        ctx,
        entry.companyId,
        entry.projectId,
      );
      return { entry, company, project };
    } catch (error) {
      if (
        error instanceof ConvexError &&
        typeof error.data === 'object' &&
        error.data?.code === 'NOT_FOUND'
      )
        return null;
      throw error;
    }
  },
});
export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
    draftsOnly: v.optional(v.boolean()),
    projectId: v.optional(v.id('projects')),
  },
  returns: paginationResultValidator(schema.doc('entries')),
  handler: async (ctx, { paginationOpts, draftsOnly, projectId }) => {
    const userId = await requireUserId(ctx);
    if (projectId) {
      await requireOwnedProject(ctx, projectId);
      const entries = ctx.db
        .query('entries')
        .withIndex('by_user_project_deleted_date', (q) =>
          q
            .eq('userId', userId)
            .eq('projectId', projectId)
            .eq('deletedAt', undefined),
        );
      return (
        draftsOnly
          ? entries.filter((q) => q.eq(q.field('status'), 'draft'))
          : entries
      )
        .order('desc')
        .paginate(paginationOpts);
    }
    return (
      draftsOnly
        ? ctx.db
            .query('entries')
            .withIndex('by_user_deleted_status_updated', (q) =>
              q
                .eq('userId', userId)
                .eq('deletedAt', undefined)
                .eq('status', 'draft'),
            )
        : ctx.db
            .query('entries')
            .withIndex('by_user_deleted_date', (q) =>
              q.eq('userId', userId).eq('deletedAt', undefined),
            )
    )
      .order('desc')
      .paginate(paginationOpts);
  },
});
export const create = mutation({
  args: {
    companyId: v.id('companies'),
    projectId: v.id('projects'),
    creationKey: v.string(),
    ...entryContentFields,
  },
  returns: schema.doc('entries'),
  handler: async (ctx, { companyId, projectId, creationKey, ...input }) => {
    const userId = await requireUserId(ctx);
    requestKey(creationKey);
    const existing = await ctx.db
      .query('entries')
      .withIndex('by_user_creation_key', (q) =>
        q.eq('userId', userId).eq('creationKey', creationKey),
      )
      .unique();
    if (existing) {
      await requireOwnedEntry(ctx, existing._id);
      if (existing.deletedAt !== undefined) notAvailable();
      return existing;
    }
    const { project } = await requireCompanyProject(ctx, companyId, projectId);
    if (project.status !== 'active')
      throw new ConvexError({
        code: 'VALIDATION_ERROR',
        message: 'Choose an active project for new work.',
      });
    const values = validate(input);
    const now = Date.now();
    const id = await ctx.db.insert('entries', {
      ...values,
      companyId,
      projectId,
      userId,
      creationKey,
      status: 'draft',
      revision: INITIAL_ENTRY_REVISION,
      createdAt: now,
      updatedAt: now,
    });
    return (await ctx.db.get('entries', id))!;
  },
});
const writeArgs = {
  ...entryIdArgs,
  companyId: v.id('companies'),
  projectId: v.id('projects'),
  expectedRevision: v.number(),
  writeId: v.string(),
  ...entryContentFields,
};
type WriteInput = EntryFormValues & {
  entryId: Id<'entries'>;
  companyId: Id<'companies'>;
  projectId: Id<'projects'>;
  expectedRevision: number;
  writeId: string;
};
async function writeEntry(
  ctx: MutationCtx,
  {
    entryId,
    companyId,
    projectId,
    expectedRevision,
    writeId,
    ...input
  }: WriteInput,
  complete: boolean,
): Promise<Doc<'entries'>> {
  const entry = await requireOwnedEntry(ctx, entryId);
  if (entry.deletedAt !== undefined) notAvailable();
  requestKey(writeId);
  const status = complete ? 'completed' : entry.status;
  const values = validate(input, status === 'completed');
  const same =
    entry.companyId === companyId &&
    entry.projectId === projectId &&
    entry.status === status &&
    Object.entries(values).every(
      ([key, value]) =>
        JSON.stringify(Reflect.get(entry, key)) === JSON.stringify(value),
    );
  // A response lost in transit can retry its exact payload without another write.
  if (
    entry.lastWriteId === writeId &&
    entry.revision === expectedRevision + 1 &&
    same
  )
    return entry;
  const revision = nextEntryRevision(entry, expectedRevision);
  const { project } = await requireCompanyProject(ctx, companyId, projectId);
  if (
    project.status === 'archived' &&
    (entry.projectId !== projectId || entry.companyId !== companyId)
  )
    throw new ConvexError({
      code: 'VALIDATION_ERROR',
      message: 'Choose an active project for new work.',
    });
  if (same) return entry;
  await ctx.db.patch('entries', entryId, {
    ...values,
    companyId,
    projectId,
    status,
    revision,
    lastWriteId: writeId,
    updatedAt: Date.now(),
  });
  return (await ctx.db.get('entries', entryId))!;
}
export const update = mutation({
  args: writeArgs,
  returns: schema.doc('entries'),
  handler: (ctx, args) => writeEntry(ctx, args, false),
});
export const complete = mutation({
  args: writeArgs,
  returns: schema.doc('entries'),
  handler: (ctx, args) => writeEntry(ctx, args, true),
});
export const discard = mutation({
  args: { ...entryIdArgs, expectedRevision: v.number(), writeId: v.string() },
  returns: schema.doc('entries'),
  handler: async (ctx, { entryId, expectedRevision, writeId }) => {
    const entry = await requireOwnedEntry(ctx, entryId);
    requestKey(writeId);
    if (
      entry.deletedAt !== undefined &&
      entry.lastWriteId === writeId &&
      entry.revision === expectedRevision + 1
    )
      return entry;
    if (entry.deletedAt !== undefined) notAvailable();
    if (entry.status !== 'draft')
      throw new ConvexError({
        code: 'VALIDATION_ERROR',
        message: 'Only drafts can be discarded here.',
      });
    const revision = nextEntryRevision(entry, expectedRevision);
    await ctx.db.patch('entries', entryId, {
      deletedAt: Date.now(),
      updatedAt: Date.now(),
      revision,
      lastWriteId: writeId,
    });
    return (await ctx.db.get('entries', entryId))!;
  },
});
