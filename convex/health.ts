import { v } from 'convex/values';
import { query } from './_generated/server';

// Intentionally public: a connectivity check containing no user or deployment data.
export const check = query({
  args: {},
  returns: v.object({ service: v.literal('joti'), status: v.literal('ok') }),
  handler: () => ({ service: 'joti' as const, status: 'ok' as const }),
});
