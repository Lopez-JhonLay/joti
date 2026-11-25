import { getAuthUserId } from '@convex-dev/auth/server';
import type { Doc, Id } from '../convex/_generated/dataModel';
import type { QueryCtx } from '../convex/_generated/server';
import {
  requireCompanyProject,
  requireOwnedCompany,
  requireOwnedProject,
} from '../convex/lib/organization';

jest.mock('@convex-dev/auth/server', () => ({ getAuthUserId: jest.fn() }));

const getUserId = jest.mocked(getAuthUserId);
const owner = 'owner' as Id<'users'>;
const stranger = 'stranger' as Id<'users'>;
const companyId = 'company' as Id<'companies'>;
const otherCompanyId = 'other-company' as Id<'companies'>;
const projectId = 'project' as Id<'projects'>;
const company: Doc<'companies'> = {
  _id: companyId,
  _creationTime: 1,
  userId: owner,
  name: 'Company',
  createdAt: 1,
  updatedAt: 1,
};
const project: Doc<'projects'> = {
  _id: projectId,
  _creationTime: 1,
  userId: owner,
  companyId,
  name: 'Project',
  status: 'active',
  isGeneral: false,
  createdAt: 1,
  updatedAt: 1,
};

const records = new Map<string, Doc<'companies'> | Doc<'projects'>>();
const get = jest.fn(
  async (_table: string, id: string) => records.get(id) ?? null,
);
// Only the reader and session APIs used by these helpers are needed here.
const ctx = { db: { get } } as unknown as QueryCtx;
const unavailable = {
  data: { code: 'NOT_FOUND', message: 'This record is unavailable.' },
};

beforeEach(() => {
  jest.resetAllMocks();
  getUserId.mockResolvedValue(owner);
  get.mockImplementation(async (_table, id) => records.get(id) ?? null);
  records.clear();
  records.set(companyId, company);
  records.set(projectId, project);
});

test('owned companies and projects resolve through the live session', async () => {
  await expect(requireOwnedCompany(ctx, companyId)).resolves.toEqual(company);
  await expect(requireOwnedProject(ctx, projectId)).resolves.toEqual(project);
  await expect(
    requireCompanyProject(ctx, companyId, projectId),
  ).resolves.toEqual({ company, project });
});

test('signed-out callers cannot resolve company or project records', async () => {
  getUserId.mockResolvedValue(null);
  const unauthenticated = { data: { code: 'UNAUTHENTICATED' } };
  await expect(requireOwnedCompany(ctx, companyId)).rejects.toMatchObject(
    unauthenticated,
  );
  await expect(requireOwnedProject(ctx, projectId)).rejects.toMatchObject(
    unauthenticated,
  );
  await expect(
    requireCompanyProject(ctx, companyId, projectId),
  ).rejects.toMatchObject(unauthenticated);
});

test('missing and foreign companies and projects are indistinguishable', async () => {
  getUserId.mockResolvedValue(stranger);
  await expect(requireOwnedCompany(ctx, companyId)).rejects.toMatchObject(
    unavailable,
  );
  await expect(requireOwnedProject(ctx, projectId)).rejects.toMatchObject(
    unavailable,
  );
  records.clear();
  getUserId.mockResolvedValue(owner);
  await expect(requireOwnedCompany(ctx, companyId)).rejects.toMatchObject(
    unavailable,
  );
  await expect(requireOwnedProject(ctx, projectId)).rejects.toMatchObject(
    unavailable,
  );
});

test.each(['missing', 'foreign'])(
  'an owned project with a %s parent company is rejected',
  async (parent) => {
    if (parent === 'missing') records.delete(companyId);
    else records.set(companyId, { ...company, userId: stranger });
    await expect(requireOwnedProject(ctx, projectId)).rejects.toMatchObject(
      unavailable,
    );
    await expect(
      requireCompanyProject(ctx, companyId, projectId),
    ).rejects.toMatchObject(unavailable);
  },
);

test('a foreign project cannot be paired with an owned company', async () => {
  records.set(projectId, { ...project, userId: stranger });
  await expect(
    requireCompanyProject(ctx, companyId, projectId),
  ).rejects.toMatchObject(unavailable);
});

test('two owned records must still belong to the same company', async () => {
  records.set(otherCompanyId, { ...company, _id: otherCompanyId });
  await expect(
    requireCompanyProject(ctx, otherCompanyId, projectId),
  ).rejects.toMatchObject({ data: { code: 'VALIDATION_ERROR' } });
});

test('archived projects remain valid historical relationships', async () => {
  const archived = { ...project, status: 'archived' as const };
  records.set(projectId, archived);
  await expect(
    requireCompanyProject(ctx, companyId, projectId),
  ).resolves.toEqual({ company, project: archived });
});
