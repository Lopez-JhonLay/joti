import { ConvexError } from 'convex/values';
import type { Doc, Id } from '../_generated/dataModel';
import type { QueryCtx } from '../_generated/server';
import { requireOwnedRecord } from './auth';
import { requireCompanyProject } from './organization';

type EntryContext = Pick<QueryCtx, 'auth' | 'runQuery' | 'db'>;
type EntryReader = Pick<QueryCtx, 'db'>;

export const INITIAL_ENTRY_REVISION = 1;

export async function requireOwnedEntry(
  ctx: EntryContext,
  entryId: Id<'entries'>,
) {
  const entry = await requireOwnedRecord(
    ctx,
    await ctx.db.get('entries', entryId),
  );
  // Archive and Trash retain their historical relationships. Individual write
  // operations must additionally enforce lifecycle rules before changing them.
  await requireCompanyProject(ctx, entry.companyId, entry.projectId);
  return entry;
}

// Call inside the same mutation that applies the write. Convex retries alone
// cannot protect against an older client payload sent after a newer save.
export function nextEntryRevision(
  entry: Pick<Doc<'entries'>, 'revision'>,
  expectedRevision: number,
) {
  if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 1) {
    throw new ConvexError({
      code: 'VALIDATION_ERROR',
      message: 'Provide a valid entry revision.',
    });
  }
  if (
    !Number.isSafeInteger(entry.revision) ||
    entry.revision < 1 ||
    entry.revision >= Number.MAX_SAFE_INTEGER ||
    entry.revision !== expectedRevision
  ) {
    throw new ConvexError({
      code: 'CONFLICT',
      message: 'This entry has changed. Reload it before saving again.',
    });
  }
  return entry.revision + 1;
}

export async function requireNoCompanyEntries(
  ctx: EntryReader,
  companyId: Id<'companies'>,
) {
  const entry = await ctx.db
    .query('entries')
    .withIndex('by_company', (q) => q.eq('companyId', companyId))
    .first();
  if (entry)
    throw new ConvexError({
      code: 'HAS_RELATED_RECORDS',
      message: 'Companies with journal entries cannot be deleted.',
    });
}

// No permanent project deletion endpoint is exposed. Any future endpoint must
// call this after ownership validation and before deleting in that transaction.
export async function requireNoProjectEntries(
  ctx: EntryReader,
  projectId: Id<'projects'>,
) {
  const entry = await ctx.db
    .query('entries')
    .withIndex('by_project', (q) => q.eq('projectId', projectId))
    .first();
  if (entry)
    throw new ConvexError({
      code: 'HAS_RELATED_RECORDS',
      message: 'Projects with journal entries cannot be deleted.',
    });
}
