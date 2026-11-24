import { getAuthUserId } from '@convex-dev/auth/server';
import { ConvexError } from 'convex/values';
import type { QueryCtx } from '../_generated/server';
import type { Id } from '../_generated/dataModel';

type AuthContext = Pick<QueryCtx, 'auth' | 'runQuery'>;

export async function requireUserId(ctx: AuthContext): Promise<Id<'users'>> {
  // Resolve the live server-side session, not a client-supplied ID or decoded JWT.
  const userId = await getAuthUserId(ctx);
  if (!userId)
    throw new ConvexError({
      code: 'UNAUTHENTICATED',
      message: 'Sign in to continue.',
    });
  return userId;
}

export async function requireOwnedRecord<T extends { userId: Id<'users'> }>(
  ctx: AuthContext,
  record: T | null,
): Promise<T> {
  const userId = await requireUserId(ctx);
  // Missing and foreign records share an error so callers cannot enumerate IDs.
  if (!record || record.userId !== userId) {
    throw new ConvexError({
      code: 'NOT_FOUND',
      message: 'This record is unavailable.',
    });
  }
  return record;
}
