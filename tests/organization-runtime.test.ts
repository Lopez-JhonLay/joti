import { defineTestApp, type TestConvex } from 'convex-test';
import { componentsGeneric, type ApiFromModules } from 'convex/server';
import { v } from 'convex/values';
import authSchema from '../node_modules/@convex-dev/auth/dist/component/schema';
import * as authPublic from '../node_modules/@convex-dev/auth/dist/component/public';
import schema from '../convex/schema';
import * as companies from '../convex/companies';
import * as projects from '../convex/projects';
import * as generalProjects from '../convex/lib/general_projects';
import type { Id } from '../convex/_generated/dataModel';

// Seed session rows without OAuth/network calls. Production getAuthUserId and
// the auth component's real getSession query resolve every domain request.
const authApp = defineTestApp({ schema: authSchema });
const fixture = {
  createSession: authApp.mutation({
    args: { userId: v.string() },
    handler: (ctx, { userId }) =>
      ctx.db.insert('sessions', { userId, component: 'authGoogle' }),
  }),
  revokeSession: authApp.mutation({
    args: { sessionId: v.id('sessions') },
    handler: (ctx, { sessionId }) => ctx.db.delete('sessions', sessionId),
  }),
};
type AuthFixtureApi = ApiFromModules<{ fixture: typeof fixture }>;
const auth = (componentsGeneric() as unknown as { auth: AuthFixtureApi }).auth;

const app = defineTestApp({
  schema,
  components: {
    auth: {
      register: (t: TestConvex<typeof schema>) =>
        t.registerComponent('auth', authSchema, {
          './_generated/server.ts': async () => ({}),
          './public.ts': async () => authPublic,
          './fixture.ts': async () => fixture,
        }),
    },
  },
}).defineModules({ companies, projects });

async function setup() {
  const t = app.createTest();
  const userId = await t.run((ctx) => ctx.db.insert('users', {}));
  const otherUserId = await t.run((ctx) => ctx.db.insert('users', {}));
  const sessionId = await t.mutation(auth.fixture.createSession, { userId });
  const otherSessionId = await t.mutation(auth.fixture.createSession, {
    userId: otherUserId,
  });
  const owner = t.withIdentity({ subject: sessionId });
  const stranger = t.withIdentity({ subject: otherSessionId });
  const companyId = await owner.mutation(app.api.companies.create, {
    name: 'Example',
  });
  const otherCompanyId = await stranger.mutation(app.api.companies.create, {
    name: 'Other employer',
  });
  const projectId = await owner.mutation(app.api.projects.create, {
    companyId,
    name: 'Release',
    description: 'Original scope',
  });
  return {
    t,
    owner,
    stranger,
    userId,
    otherUserId,
    sessionId,
    companyId,
    otherCompanyId,
    projectId,
  };
}

const paginationOpts = { numItems: 1, cursor: null };

test('live session resolution rejects a user ID masquerading as a session and revoked sessions', async () => {
  const { t, owner, userId, sessionId } = await setup();
  const forged = t.withIdentity({ subject: userId });
  await expect(
    forged.query(app.api.companies.list, { paginationOpts }),
  ).rejects.toThrow('UNAUTHENTICATED');
  await t.mutation(auth.fixture.revokeSession, { sessionId });
  await expect(
    owner.query(app.api.companies.list, { paginationOpts }),
  ).rejects.toThrow('UNAUTHENTICATED');
  await expect(
    owner.mutation(app.api.companies.create, { name: 'Denied' }),
  ).rejects.toThrow('UNAUTHENTICATED');
});

test('anonymous calls cannot read or mutate valid organization IDs', async () => {
  const { t, companyId, projectId } = await setup();
  const requests = [
    () => t.query(app.api.companies.get, { companyId }),
    () => t.query(app.api.projects.get, { projectId }),
    () => t.query(app.api.projects.list, { companyId, paginationOpts }),
    () => t.query(app.api.projects.general, { companyId }),
    () => t.mutation(app.api.companies.update, { companyId, name: 'Denied' }),
    () => t.mutation(app.api.companies.remove, { companyId }),
    () => t.mutation(app.api.projects.create, { companyId, name: 'Denied' }),
    () => t.mutation(app.api.projects.ensureGeneral, { companyId }),
    () =>
      t.mutation(app.api.projects.update, {
        projectId,
        name: 'Denied',
        status: 'active',
      }),
    () =>
      t.mutation(app.api.projects.setStatus, { projectId, status: 'archived' }),
  ];
  for (const request of requests)
    await expect(request()).rejects.toThrow('UNAUTHENTICATED');
});

test('foreign reads conceal records and foreign writes leave both owners unchanged', async () => {
  const { t, stranger, companyId, projectId } = await setup();
  const before = await t.run(async (ctx) => ({
    companies: await ctx.db.query('companies').collect(),
    projects: await ctx.db.query('projects').collect(),
  }));
  expect(await stranger.query(app.api.companies.get, { companyId })).toBeNull();
  expect(await stranger.query(app.api.projects.get, { projectId })).toBeNull();
  const requests = [
    () => stranger.query(app.api.projects.list, { companyId, paginationOpts }),
    () => stranger.query(app.api.projects.general, { companyId }),
    () =>
      stranger.mutation(app.api.companies.update, {
        companyId,
        name: 'Stolen',
      }),
    () => stranger.mutation(app.api.companies.remove, { companyId }),
    () =>
      stranger.mutation(app.api.projects.create, {
        companyId,
        name: 'Injected',
      }),
    () => stranger.mutation(app.api.projects.ensureGeneral, { companyId }),
    () =>
      stranger.mutation(app.api.projects.update, {
        projectId,
        name: 'Stolen',
        status: 'archived',
      }),
    () =>
      stranger.mutation(app.api.projects.setStatus, {
        projectId,
        status: 'archived',
      }),
  ];
  for (const request of requests)
    await expect(request()).rejects.toThrow('NOT_FOUND');
  expect(
    await t.run(async (ctx) => ({
      companies: await ctx.db.query('companies').collect(),
      projects: await ctx.db.query('projects').collect(),
    })),
  ).toEqual(before);
});

test.each(['userId', 'createdAt', 'updatedAt', 'isGeneral', 'companyId'])(
  'registered validators reject overposting protected %s fields',
  async (field) => {
    const { owner, companyId, otherCompanyId, projectId, otherUserId } =
      await setup();
    const extra = {
      [field]:
        field === 'companyId'
          ? otherCompanyId
          : field === 'userId'
            ? otherUserId
            : field === 'isGeneral'
              ? true
              : 0,
    };
    // companyId is the company's update target, but is never an editable
    // project field. The other protected fields are invalid on both APIs.
    if (field !== 'companyId') {
      await expect(
        owner.mutation(app.api.companies.update, {
          companyId,
          name: 'Changed',
          ...extra,
        }),
      ).rejects.toThrow();
    }
    await expect(
      owner.mutation(app.api.projects.update, {
        projectId,
        name: 'Changed',
        status: 'active',
        ...extra,
      }),
    ).rejects.toThrow();
    expect(
      await owner.query(app.api.projects.get, { projectId }),
    ).toMatchObject({
      project: { companyId, name: 'Release', isGeneral: false },
    });
  },
);

test('validators reject malformed and wrong-table IDs before accessing records', async () => {
  const { owner, userId, projectId } = await setup();
  for (const id of ['malformed', userId, projectId]) {
    await expect(
      owner.query(app.api.companies.get, { companyId: id as Id<'companies'> }),
    ).rejects.toThrow();
  }
});

test('registered CRUD normalizes values, clears optionals and leaves invalid writes unapplied', async () => {
  const { owner, t, companyId, projectId } = await setup();
  await owner.mutation(app.api.companies.update, {
    companyId,
    name: ' Updated employer ',
    jobTitle: ' Developer ',
    startDate: '2026-01-01',
  });
  expect(await owner.query(app.api.companies.get, { companyId })).toMatchObject(
    {
      name: 'Updated employer',
      jobTitle: 'Developer',
      startDate: '2026-01-01',
    },
  );
  await owner.mutation(app.api.companies.update, {
    companyId,
    name: 'Updated employer',
  });
  const company = await owner.query(app.api.companies.get, { companyId });
  expect(company?.jobTitle).toBeUndefined();
  expect(company?.startDate).toBeUndefined();
  await owner.mutation(app.api.projects.update, {
    projectId,
    name: ' Revised release ',
    status: 'active',
  });
  const project = await owner.query(app.api.projects.get, { projectId });
  expect(project?.project.name).toBe('Revised release');
  expect(project?.project.description).toBeUndefined();
  await expect(
    owner.mutation(app.api.companies.update, {
      companyId,
      name: 'Invalid dates',
      startDate: '2026-02-30',
    }),
  ).rejects.toThrow('VALIDATION_ERROR');
  await expect(
    owner.mutation(app.api.projects.update, {
      projectId,
      name: ' general / adhoc ',
      status: 'active',
    }),
  ).rejects.toThrow('VALIDATION_ERROR');
  await expect(
    owner.mutation(app.api.companies.create, { name: ' ' }),
  ).rejects.toThrow('VALIDATION_ERROR');
  expect(await owner.query(app.api.companies.get, { companyId })).toEqual(
    company,
  );
  expect(await owner.query(app.api.projects.get, { projectId })).toEqual(
    project,
  );
  expect(
    await t.run((ctx) => ctx.db.query('companies').collect()),
  ).toHaveLength(2);
});

test('foreign-owned children under an owned parent cannot leak through indexed queries or built-in repair', async () => {
  const { t, owner, companyId, projectId, otherUserId } = await setup();
  const general = await owner.query(app.api.projects.general, { companyId });
  if (!general) throw new Error('Expected provisioned category');
  await t.run(async (ctx) => {
    await ctx.db.patch('projects', projectId, { userId: otherUserId });
    await ctx.db.patch('projects', general._id, { userId: otherUserId });
  });
  expect(
    (await owner.query(app.api.projects.list, { companyId, paginationOpts }))
      .page,
  ).toEqual([]);
  expect(await owner.query(app.api.projects.general, { companyId })).toBeNull();
  await expect(
    owner.mutation(app.api.projects.ensureGeneral, { companyId }),
  ).rejects.toThrow('NOT_FOUND');
  expect(
    await t.run((ctx) => ctx.db.get('projects', general._id)),
  ).toMatchObject({ userId: otherUserId });
});

test('indexed pagination isolates owners and company/status filters', async () => {
  const { owner, stranger, companyId, projectId } = await setup();
  const secondCompanyId = await owner.mutation(app.api.companies.create, {
    name: 'Second employer',
  });
  const archivedId = await owner.mutation(app.api.projects.create, {
    companyId,
    name: 'Archived work',
  });
  await owner.mutation(app.api.projects.setStatus, {
    projectId: archivedId,
    status: 'archived',
  });
  const first = await owner.query(app.api.companies.list, { paginationOpts });
  const second = await owner.query(app.api.companies.list, {
    paginationOpts: { ...paginationOpts, cursor: first.continueCursor },
  });
  expect(
    new Set([...first.page, ...second.page].map((company) => company._id)),
  ).toEqual(new Set([companyId, secondCompanyId]));
  const foreignPage = await stranger.query(app.api.companies.list, {
    paginationOpts,
  });
  expect(foreignPage.page.some((company) => company._id === companyId)).toBe(
    false,
  );
  const active = await owner.query(app.api.projects.list, {
    companyId,
    status: 'active',
    namedOnly: true,
    paginationOpts,
  });
  const archived = await owner.query(app.api.projects.list, {
    companyId,
    status: 'archived',
    namedOnly: true,
    paginationOpts,
  });
  expect(active.page.map((project) => project._id)).toEqual([projectId]);
  expect(archived.page.map((project) => project._id)).toEqual([archivedId]);
});

test('archive and restore preserve identity, description and parent; archived children still block deletion', async () => {
  const { owner, companyId, projectId } = await setup();
  const original = await owner.query(app.api.projects.get, { projectId });
  await owner.mutation(app.api.projects.setStatus, {
    projectId,
    status: 'archived',
  });
  await expect(
    owner.mutation(app.api.companies.remove, { companyId }),
  ).rejects.toThrow('HAS_RELATED_RECORDS');
  await owner.mutation(app.api.projects.setStatus, {
    projectId,
    status: 'active',
  });
  const restored = await owner.query(app.api.projects.get, { projectId });
  expect(restored?.project).toEqual({
    ...original?.project,
    updatedAt: expect.any(Number),
  });
});

test('built-in category is stable across retries and blocked edits; empty parent cleanup removes both records', async () => {
  const { owner, t } = await setup();
  const companyId = await owner.mutation(app.api.companies.create, {
    name: 'Empty',
  });
  const general = await owner.query(app.api.projects.general, { companyId });
  const projectId = await owner.mutation(app.api.projects.ensureGeneral, {
    companyId,
  });
  expect(
    await owner.mutation(app.api.projects.ensureGeneral, { companyId }),
  ).toBe(projectId);
  expect(projectId).toBe(general?._id);
  await expect(
    owner.mutation(app.api.projects.setStatus, {
      projectId,
      status: 'archived',
    }),
  ).rejects.toThrow('VALIDATION_ERROR');
  await expect(
    owner.mutation(app.api.projects.update, {
      projectId,
      name: 'Renamed',
      status: 'active',
    }),
  ).rejects.toThrow('VALIDATION_ERROR');
  await owner.mutation(app.api.companies.remove, { companyId });
  expect(await t.run((ctx) => ctx.db.get('companies', companyId))).toBeNull();
  expect(await t.run((ctx) => ctx.db.get('projects', projectId))).toBeNull();
});

test('broken or foreign parent relationships conceal project details and reject edits', async () => {
  const { t, owner, projectId, otherCompanyId, companyId } = await setup();
  await t.run((ctx) =>
    ctx.db.patch('projects', projectId, { companyId: otherCompanyId }),
  );
  expect(await owner.query(app.api.projects.get, { projectId })).toBeNull();
  await expect(
    owner.mutation(app.api.projects.setStatus, {
      projectId,
      status: 'archived',
    }),
  ).rejects.toThrow('NOT_FOUND');
  await t.run(async (ctx) => {
    await ctx.db.patch('projects', projectId, { companyId });
    await ctx.db.delete('companies', companyId);
  });
  expect(await owner.query(app.api.projects.get, { projectId })).toBeNull();
  await expect(
    owner.mutation(app.api.projects.update, {
      projectId,
      name: 'Changed',
      status: 'active',
    }),
  ).rejects.toThrow('NOT_FOUND');
});

test('registered company creation provisions its General project', async () => {
  const t = app.createTest();
  const userId = await t.run((ctx) => ctx.db.insert('users', {}));
  const sessionId = await t.mutation(auth.fixture.createSession, { userId });
  const owner = t.withIdentity({ subject: sessionId });
  const companyId = await owner.mutation(app.api.companies.create, {
    name: ' Example ',
  });
  expect(await owner.query(app.api.companies.get, { companyId })).toMatchObject(
    {
      name: 'Example',
      userId,
    },
  );
  expect(
    await owner.query(app.api.projects.general, { companyId }),
  ).toMatchObject({
    companyId,
    userId,
    isGeneral: true,
    status: 'active',
  });
});

test('failed provisioning rolls back both company and General writes', async () => {
  const { t, owner } = await setup();
  const snapshot = () =>
    t.run(async (ctx) => ({
      companies: await ctx.db.query('companies').collect(),
      projects: await ctx.db.query('projects').collect(),
    }));
  const before = await snapshot();
  const provision = generalProjects.ensureGeneralProject;
  const failure = jest
    .spyOn(generalProjects, 'ensureGeneralProject')
    .mockImplementationOnce(async (...args) => {
      await provision(...args);
      throw new Error('Simulated provisioning failure');
    });
  try {
    await expect(
      owner.mutation(app.api.companies.create, { name: 'Must roll back' }),
    ).rejects.toThrow('Simulated provisioning failure');
  } finally {
    failure.mockRestore();
  }
  expect(await snapshot()).toEqual(before);
});
