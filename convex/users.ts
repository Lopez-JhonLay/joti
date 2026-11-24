import { v } from 'convex/values';
import { vGoogleProfile } from '@convex-dev/auth/methods/google/server';
import { internalMutation, query } from './_generated/server';
import { requireUserId } from './lib/auth';

export const current = query({
  args: {},
  returns: v.object({ userId: v.id('users') }),
  handler: async (ctx) => ({ userId: await requireUserId(ctx) }),
});

const googleMethod = v.object({
  name: v.literal('google'),
  profile: vGoogleProfile,
});

// Provider subject -> app user mapping is managed by Auth's Google component.
// Never link independent accounts based on a caller-supplied email address.
export const createGoogleUser = internalMutation({
  args: { method: googleMethod },
  returns: v.id('users'),
  handler: async (ctx, { method: { profile } }) =>
    ctx.db.insert('users', {
      name: profile.name,
      email: profile.emailVerified ? profile.email : undefined,
      imageUrl: profile.picture,
      createdAt: Date.now(),
    }),
});

export const syncGoogleProfile = internalMutation({
  args: { method: googleMethod, userId: v.id('users') },
  returns: v.null(),
  handler: async (ctx, { method: { profile }, userId }) => {
    await ctx.db.patch('users', userId, {
      name: profile.name,
      email: profile.emailVerified ? profile.email : undefined,
      imageUrl: profile.picture,
    });
    return null;
  },
});
