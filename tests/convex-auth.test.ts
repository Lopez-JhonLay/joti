import { getAuthUserId } from '@convex-dev/auth/server';
import type { Id } from '../convex/_generated/dataModel';
import type { QueryCtx } from '../convex/_generated/server';
import { requireOwnedRecord, requireUserId } from '../convex/lib/auth';

jest.mock('@convex-dev/auth/server', () => ({ getAuthUserId: jest.fn() }));
const getUserId = jest.mocked(getAuthUserId);
const ctx = {} as QueryCtx;
const owner = 'owner' as Id<'users'>;
const otherUser = 'other' as Id<'users'>;
beforeEach(() => jest.resetAllMocks());

test('signed-out callers cannot access protected records', async () => {
  getUserId.mockResolvedValue(null);
  const expected = { data: { code: 'UNAUTHENTICATED' } };
  await expect(requireUserId(ctx)).rejects.toMatchObject(expected);
  await expect(
    requireOwnedRecord(ctx, { userId: owner }),
  ).rejects.toMatchObject(expected);
});

test('the session owner can access a record', async () => {
  getUserId.mockResolvedValue(owner);
  const record = { userId: owner };
  await expect(requireOwnedRecord(ctx, record)).resolves.toBe(record);
});

test('missing and foreign records return the same error', async () => {
  getUserId.mockResolvedValue(otherUser);
  const expected = {
    data: { code: 'NOT_FOUND', message: 'This record is unavailable.' },
  };
  await expect(requireOwnedRecord(ctx, null)).rejects.toMatchObject(expected);
  await expect(
    requireOwnedRecord(ctx, { userId: owner }),
  ).rejects.toMatchObject(expected);
});
