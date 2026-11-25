import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { companyFields, projectFields } from './lib/organization_validators';

export default defineSchema({
  // Auth v2 keeps credentials/sessions in its isolated component. The app owns
  // user profiles and private domain records.
  users: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    createdAt: v.optional(v.number()),
  }),
  companies: defineTable({
    ...companyFields,
    userId: v.id('users'),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_user', ['userId']),
  projects: defineTable({
    ...projectFields,
    userId: v.id('users'),
    isGeneral: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_company', ['companyId'])
    .index('by_user_company_status', ['userId', 'companyId', 'status'])
    .index('by_company_general', ['companyId', 'isGeneral']),
});
