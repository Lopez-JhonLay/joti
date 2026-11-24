import { v } from 'convex/values';
import { query } from './_generated/server';
import { requireUserId } from './lib/auth';

export const current = query({
  args: {},
  returns: v.object({ userId: v.id('users') }),
  handler: async (ctx) => ({ userId: await requireUserId(ctx) }),
});
