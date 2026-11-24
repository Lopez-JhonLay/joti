import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  // Auth v2 keeps credentials/sessions in its isolated component. The app owns
  // user profiles; domain tables are added in their implementation phases.
  users: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  }),
});
