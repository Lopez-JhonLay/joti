import type { Id } from '../convex/_generated/dataModel';

export type EntryOrganization = {
  companyId: Id<'companies'>;
  projectId: Id<'projects'>;
};
