import { defineTestApp } from 'convex-test';
import schema from '../convex/schema';
import * as companies from '../convex/companies';
import * as projects from '../convex/projects';
import {
  INITIAL_ENTRY_REVISION,
  nextEntryRevision,
  requireNoProjectEntries,
  requireOwnedEntry,
} from '../convex/lib/entries';
import type { Doc } from '../convex/_generated/dataModel';

// Session resolution is covered with the real Auth component in
// organization-runtime.test.ts. Here identities isolate entry model behavior.
jest.mock('@convex-dev/auth/server', () => ({
  getAuthUserId: async (ctx: {
    auth: { getUserIdentity: () => Promise<{ subject: string } | null> };
  }) => (await ctx.auth.getUserIdentity())?.subject ?? null,
}));

const app = defineTestApp({ schema }).defineModules({ companies, projects });

async function setup() {
  const t = app.createTest();
  const userId = await t.run((ctx) => ctx.db.insert('users', {}));
  const otherUserId = await t.run((ctx) => ctx.db.insert('users', {}));
  const owner = t.withIdentity({ subject: userId });
  const stranger = t.withIdentity({ subject: otherUserId });
  const companyId = await owner.mutation(app.api.companies.create, {
    name: 'Employer',
  });
  const general = await owner.query(app.api.projects.general, { companyId });
  if (!general) throw new Error('Expected provisioned category');
  const values = {
    userId,
    companyId,
    projectId: general._id,
    status: 'draft' as const,
    impactStatus: 'pending' as const,
    impactCategories: [],
    revision: INITIAL_ENTRY_REVISION,
    createdAt: 1,
    updatedAt: 1,
  } satisfies Omit<Doc<'entries'>, '_id' | '_creationTime'>;
  const entryId = await t.run((ctx) => ctx.db.insert('entries', values));
  return {
    t,
    owner,
    stranger,
    userId,
    otherUserId,
    companyId,
    general,
    values,
    entryId,
  };
}

test('schema permits incomplete drafts and optional metrics; entry and impact statuses are independent', async () => {
  const { t, owner, entryId } = await setup();
  const draft = await owner.query((ctx) => requireOwnedEntry(ctx, entryId));
  expect(draft.task).toBeUndefined();
  expect(draft.date).toBeUndefined();
  expect(draft.whatIDid).toBeUndefined();
  expect(draft.impactMetrics).toBeUndefined();
  await t.run((ctx) =>
    ctx.db.patch('entries', entryId, {
      status: 'completed',
      date: '2026-11-25',
      task: 'Release',
      whatIDid: 'Shipped a fix',
      impactStatus: 'pending',
      impactCategories: ['technical', 'business', 'people'],
      impactMetrics: 'Saved 2 hours per week',
      whoItHelped: 'Support',
      companyImpact: 'Faster resolution',
      notesAndPraise: 'Positive feedback',
    }),
  );
  expect(
    await owner.query((ctx) => requireOwnedEntry(ctx, entryId)),
  ).toMatchObject({
    status: 'completed',
    impactStatus: 'pending',
    impactCategories: ['technical', 'business', 'people'],
    impactMetrics: 'Saved 2 hours per week',
  });
  for (const impactStatus of ['known', 'not_measurable'] as const) {
    await t.run((ctx) => ctx.db.patch('entries', entryId, { impactStatus }));
  }
});

test.each([
  { status: 'published' },
  { impactStatus: 'completed' },
  { impactCategories: ['financial'] },
  { impactMetrics: 50 },
  { revision: '1' },
])('schema rejects invalid entry shapes %j', async (invalid) => {
  const { t, values } = await setup();
  await expect(
    t.run((ctx) =>
      ctx.db.insert('entries', {
        ...values,
        ...invalid,
      } as typeof values),
    ),
  ).rejects.toThrow();
  expect(await t.run((ctx) => ctx.db.query('entries').collect())).toHaveLength(
    1,
  );
});

test('entry lookup conceals missing and foreign records and requires authentication', async () => {
  const { t, owner, stranger, entryId } = await setup();
  await expect(
    t.query((ctx) => requireOwnedEntry(ctx, entryId)),
  ).rejects.toThrow('UNAUTHENTICATED');
  await expect(
    stranger.query((ctx) => requireOwnedEntry(ctx, entryId)),
  ).rejects.toThrow('NOT_FOUND');
  await t.run((ctx) => ctx.db.delete('entries', entryId));
  await expect(
    owner.query((ctx) => requireOwnedEntry(ctx, entryId)),
  ).rejects.toThrow('NOT_FOUND');
});

test('entry lookup rejects wrong-company, foreign and missing parent relationships', async () => {
  const { t, owner, stranger, companyId, entryId, general } = await setup();
  const secondCompanyId = await owner.mutation(app.api.companies.create, {
    name: 'Second employer',
  });
  await t.run((ctx) =>
    ctx.db.patch('entries', entryId, { companyId: secondCompanyId }),
  );
  await expect(
    owner.query((ctx) => requireOwnedEntry(ctx, entryId)),
  ).rejects.toThrow('VALIDATION_ERROR');
  const foreignCompanyId = await stranger.mutation(app.api.companies.create, {
    name: 'Foreign employer',
  });
  await t.run((ctx) =>
    ctx.db.patch('entries', entryId, { companyId: foreignCompanyId }),
  );
  await expect(
    owner.query((ctx) => requireOwnedEntry(ctx, entryId)),
  ).rejects.toThrow('NOT_FOUND');
  await t.run(async (ctx) => {
    await ctx.db.patch('entries', entryId, { companyId });
    await ctx.db.delete('projects', general._id);
  });
  await expect(
    owner.query((ctx) => requireOwnedEntry(ctx, entryId)),
  ).rejects.toThrow('NOT_FOUND');
});

test('archived project and Trash retain their owned historical entry relationships', async () => {
  const { t, owner, companyId, entryId } = await setup();
  const projectId = await owner.mutation(app.api.projects.create, {
    companyId,
    name: 'History',
  });
  await t.run((ctx) =>
    ctx.db.patch('entries', entryId, { projectId, deletedAt: 123 }),
  );
  await owner.mutation(app.api.projects.setStatus, {
    projectId,
    status: 'archived',
  });
  expect(
    await owner.query((ctx) => requireOwnedEntry(ctx, entryId)),
  ).toMatchObject({ projectId, deletedAt: 123 });
});

test.each([
  { status: 'draft' as const },
  {
    status: 'completed' as const,
    date: '2026-11-25',
    task: 'Release',
    whatIDid: 'Shipped',
  },
  { status: 'draft' as const, deletedAt: 123 },
  {
    status: 'completed' as const,
    date: '2026-11-25',
    task: 'Release',
    whatIDid: 'Shipped',
    deletedAt: 123,
  },
])(
  'company and project dependency guards retain General entries in state %j',
  async (state) => {
    const { t, owner, companyId, general, entryId } = await setup();
    await t.run((ctx) => ctx.db.patch('entries', entryId, state));
    await expect(
      owner.mutation(app.api.companies.remove, { companyId }),
    ).rejects.toThrow('HAS_RELATED_RECORDS');
    await expect(
      t.query((ctx) => requireNoProjectEntries(ctx, general._id)),
    ).rejects.toThrow('HAS_RELATED_RECORDS');
    expect(
      await owner.query(app.api.companies.get, { companyId }),
    ).not.toBeNull();
    expect(
      await owner.query(app.api.projects.general, { companyId }),
    ).toMatchObject({ _id: general._id });
    await t.run((ctx) => ctx.db.delete('entries', entryId));
    await expect(
      t.query((ctx) => requireNoProjectEntries(ctx, general._id)),
    ).resolves.toBeNull();
    await owner.mutation(app.api.companies.remove, { companyId });
    expect(await owner.query(app.api.companies.get, { companyId })).toBeNull();
  },
);

test('dependency guards fail closed for foreign-owned corrupt entry references', async () => {
  const { t, owner, companyId, entryId, otherUserId, general } = await setup();
  await t.run((ctx) =>
    ctx.db.patch('entries', entryId, { userId: otherUserId }),
  );
  await expect(
    owner.mutation(app.api.companies.remove, { companyId }),
  ).rejects.toThrow('HAS_RELATED_RECORDS');
  await expect(
    t.query((ctx) => requireNoProjectEntries(ctx, general._id)),
  ).rejects.toThrow('HAS_RELATED_RECORDS');
});

test('empty company cleanup also protects General entries with a mismatched companyId', async () => {
  const { t, owner, companyId, entryId, general } = await setup();
  const otherCompanyId = await owner.mutation(app.api.companies.create, {
    name: 'Other employer',
  });
  await t.run((ctx) =>
    ctx.db.patch('entries', entryId, { companyId: otherCompanyId }),
  );
  await expect(
    owner.mutation(app.api.companies.remove, { companyId }),
  ).rejects.toThrow('HAS_RELATED_RECORDS');
  expect(
    await owner.query(app.api.projects.general, { companyId }),
  ).toMatchObject({ _id: general._id });
});

test('revision check within a write prevents an older payload from replacing a newer save', async () => {
  const { owner, entryId } = await setup();
  const save = (task: string) =>
    owner.mutation(async (ctx) => {
      const entry = await requireOwnedEntry(ctx, entryId);
      const revision = nextEntryRevision(entry, 1);
      await ctx.db.patch('entries', entryId, { task, revision, updatedAt: 2 });
    });
  await save('Newer content');
  await expect(save('Stale content')).rejects.toThrow('CONFLICT');
  expect(
    await owner.query((ctx) => requireOwnedEntry(ctx, entryId)),
  ).toMatchObject({ task: 'Newer content', revision: 2 });
});

test('owner/date/status indexes separate live drafts, history, Trash and foreign users', async () => {
  const { t, userId, otherUserId, companyId, general, values, entryId } =
    await setup();
  await t.run(async (ctx) => {
    await ctx.db.insert('entries', { ...values, deletedAt: 20 });
    await ctx.db.insert('entries', { ...values, userId: otherUserId });
    await ctx.db.insert('entries', {
      ...values,
      status: 'completed',
      date: '2026-11-25',
      task: 'Release',
      whatIDid: 'Shipped',
    });
  });
  const drafts = await t.query((ctx) =>
    ctx.db
      .query('entries')
      .withIndex('by_user_deleted_status_updated', (q) =>
        q.eq('userId', userId).eq('deletedAt', undefined).eq('status', 'draft'),
      )
      .collect(),
  );
  expect(drafts.map((entry) => entry._id)).toEqual([entryId]);
  const history = await t.query((ctx) =>
    ctx.db
      .query('entries')
      .withIndex('by_user_deleted_date', (q) =>
        q.eq('userId', userId).eq('deletedAt', undefined),
      )
      .order('desc')
      .collect(),
  );
  expect(history).toHaveLength(2);
  expect(history[0].date).toBe('2026-11-25');
  const company = await t.query((ctx) =>
    ctx.db
      .query('entries')
      .withIndex('by_user_company_deleted_date', (q) =>
        q
          .eq('userId', userId)
          .eq('companyId', companyId)
          .eq('deletedAt', undefined),
      )
      .collect(),
  );
  const project = await t.query((ctx) =>
    ctx.db
      .query('entries')
      .withIndex('by_user_project_deleted_date', (q) =>
        q
          .eq('userId', userId)
          .eq('projectId', general._id)
          .eq('deletedAt', undefined),
      )
      .collect(),
  );
  expect(company).toHaveLength(2);
  expect(project).toEqual(company);
});

test('revision checks advance once and reject stale or future client revisions', () => {
  expect(INITIAL_ENTRY_REVISION).toBe(1);
  expect(nextEntryRevision({ revision: 1 }, 1)).toBe(2);
  expect(() => nextEntryRevision({ revision: 2 }, 1)).toThrow('CONFLICT');
  expect(() => nextEntryRevision({ revision: 2 }, 3)).toThrow('CONFLICT');
});

test.each([0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])(
  'rejects invalid expected revision %s',
  (expected) => {
    expect(() => nextEntryRevision({ revision: 1 }, expected)).toThrow(
      'VALIDATION_ERROR',
    );
  },
);

test.each([0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER])(
  'fails closed on invalid or exhausted stored revision %s',
  (revision) => {
    expect(() => nextEntryRevision({ revision }, 1)).toThrow('CONFLICT');
  },
);
