import { defineTestApp } from 'convex-test';
import schema from '../convex/schema';
import * as entries from '../convex/entries';
import * as companies from '../convex/companies';
import * as projects from '../convex/projects';
import { EMPTY_ENTRY } from '../lib/entry-validation';

jest.mock('@convex-dev/auth/server', () => ({
  getAuthUserId: async (ctx: {
    auth: { getUserIdentity: () => Promise<{ subject: string } | null> };
  }) => (await ctx.auth.getUserIdentity())?.subject ?? null,
}));
const app = defineTestApp({ schema }).defineModules({
  entries,
  companies,
  projects,
});
const key = 'test-request-key-00001';
const page = { paginationOpts: { numItems: 20, cursor: null } };
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
  if (!general) throw new Error('Missing General');
  const input = {
    ...EMPTY_ENTRY,
    companyId,
    projectId: general._id,
    creationKey: key,
    impactCategories: [],
    impactStatus: 'pending' as const,
  };
  const entry = await owner.mutation(app.api.entries.create, input);
  const write = {
    ...input,
    entryId: entry._id,
    expectedRevision: 1,
    writeId: 'test-update-key-00001',
  };
  const { creationKey: _creationKey, ...payload } = write;
  return { t, owner, stranger, userId, companyId, input, entry, payload };
}
test('creates partial drafts with server metadata, retrieves and lists them', async () => {
  const { owner, entry, userId } = await setup();
  expect(entry).toMatchObject({
    userId,
    revision: 1,
    status: 'draft',
    impactStatus: 'pending',
  });
  expect(entry.task).toBeUndefined();
  expect(
    (await owner.query(app.api.entries.get, { entryId: entry._id }))?.entry,
  ).toEqual(entry);
  expect(
    (await owner.query(app.api.entries.list, { ...page, draftsOnly: true }))
      .page,
  ).toEqual([entry]);
});
test('creation retry is idempotent and scoped to the user', async () => {
  const { t, owner, input, entry } = await setup();
  expect(await owner.mutation(app.api.entries.create, input)).toEqual(entry);
  expect(await t.run((ctx) => ctx.db.query('entries').collect())).toHaveLength(
    1,
  );
});
test('anonymous and foreign endpoints reject access without changing data', async () => {
  const { t, stranger, entry, input, payload } = await setup();
  for (const actor of [t, stranger]) {
    await expect(
      actor.mutation(app.api.entries.update, payload),
    ).rejects.toThrow();
    await expect(
      actor.mutation(app.api.entries.complete, payload),
    ).rejects.toThrow();
    await expect(
      actor.mutation(app.api.entries.discard, {
        entryId: entry._id,
        expectedRevision: 1,
        writeId: key,
      }),
    ).rejects.toThrow();
    await expect(
      actor.mutation(app.api.entries.create, {
        ...input,
        creationKey: 'different-create-key-0001',
      }),
    ).rejects.toThrow();
  }
  await expect(t.query(app.api.entries.list, page)).rejects.toThrow(
    'UNAUTHENTICATED',
  );
  expect((await stranger.query(app.api.entries.list, page)).page).toEqual([]);
  expect(
    await stranger.query(app.api.entries.get, { entryId: entry._id }),
  ).toBeNull();
  expect(await t.run((ctx) => ctx.db.get('entries', entry._id))).toEqual(entry);
});
test('completed entries require date, title and work description and preserve independent impact status', async () => {
  const { owner, payload } = await setup();
  await expect(
    owner.mutation(app.api.entries.complete, payload),
  ).rejects.toThrow('VALIDATION_ERROR');
  const completed = await owner.mutation(app.api.entries.complete, {
    ...payload,
    date: '2026-11-25',
    task: ' Ship ',
    whatIDid: ' Fixed a bug ',
  });
  expect(completed).toMatchObject({
    status: 'completed',
    impactStatus: 'pending',
    task: 'Ship',
    whatIDid: 'Fixed a bug',
    revision: 2,
  });
  await expect(
    owner.mutation(app.api.entries.update, { ...payload, expectedRevision: 2 }),
  ).rejects.toThrow('VALIDATION_ERROR');
  expect(
    (await owner.query(app.api.entries.list, { ...page, draftsOnly: true }))
      .page,
  ).toEqual([]);
});
test.each([
  { date: '2026-02-30' },
  { impactCategories: ['technical', 'technical'] as 'technical'[] },
  { task: 'x'.repeat(201) },
])('rejects invalid partial content %j', async (invalid) => {
  const { owner, payload } = await setup();
  await expect(
    owner.mutation(app.api.entries.update, { ...payload, ...invalid }),
  ).rejects.toThrow('VALIDATION_ERROR');
});
test('updates increment revision, clear omitted fields, skip unchanged writes and retry lost responses', async () => {
  const { owner, payload } = await setup();
  const saved = await owner.mutation(app.api.entries.update, {
    ...payload,
    task: 'First',
    notesAndPraise: 'Thanks',
  });
  expect(saved.revision).toBe(2);
  expect(
    await owner.mutation(app.api.entries.update, {
      ...payload,
      task: 'First',
      notesAndPraise: 'Thanks',
    }),
  ).toEqual(saved);
  await expect(
    owner.mutation(app.api.entries.update, { ...payload, task: 'Stale' }),
  ).rejects.toThrow('CONFLICT');
  const cleared = await owner.mutation(app.api.entries.update, {
    ...payload,
    task: 'First',
    expectedRevision: 2,
    writeId: 'second-update-key-0001',
  });
  expect(cleared.notesAndPraise).toBeUndefined();
  expect(
    await owner.mutation(app.api.entries.update, {
      ...payload,
      task: 'First',
      expectedRevision: 3,
      writeId: 'unchanged-update-key-0001',
    }),
  ).toEqual(cleared);
});
test('rejects mismatched organization and new archived selections while retaining existing history', async () => {
  const { owner, companyId, input, payload } = await setup();
  const otherCompany = await owner.mutation(app.api.companies.create, {
    name: 'Second',
  });
  await expect(
    owner.mutation(app.api.entries.update, {
      ...payload,
      companyId: otherCompany,
    }),
  ).rejects.toThrow('VALIDATION_ERROR');
  const projectId = await owner.mutation(app.api.projects.create, {
    companyId,
    name: 'Archive me',
  });
  const moved = await owner.mutation(app.api.entries.update, {
    ...payload,
    projectId,
  });
  await owner.mutation(app.api.projects.setStatus, {
    projectId,
    status: 'archived',
  });
  await expect(
    owner.mutation(app.api.entries.create, {
      ...input,
      projectId,
      creationKey: 'another-creation-key-0001',
    }),
  ).rejects.toThrow('VALIDATION_ERROR');
  expect(
    await owner.mutation(app.api.entries.update, {
      ...payload,
      projectId,
      expectedRevision: moved.revision,
      task: 'Historical edit',
      writeId: 'history-write-key-0001',
    }),
  ).toMatchObject({ task: 'Historical edit' });
});
test('discard is revision checked, retryable, retained in Trash, and hidden from normal reads', async () => {
  const { t, owner, entry, payload, input, companyId } = await setup();
  const discard = { entryId: entry._id, expectedRevision: 1, writeId: key };
  await expect(
    owner.mutation(app.api.entries.discard, {
      ...discard,
      expectedRevision: 2,
    }),
  ).rejects.toThrow('CONFLICT');
  const deleted = await owner.mutation(app.api.entries.discard, discard);
  expect(deleted.deletedAt).toEqual(expect.any(Number));
  expect(await owner.mutation(app.api.entries.discard, discard)).toEqual(
    deleted,
  );
  expect(
    await owner.query(app.api.entries.get, { entryId: entry._id }),
  ).toBeNull();
  expect((await owner.query(app.api.entries.list, page)).page).toEqual([]);
  await expect(
    owner.mutation(app.api.entries.update, { ...payload, expectedRevision: 2 }),
  ).rejects.toThrow('NOT_FOUND');
  await expect(owner.mutation(app.api.entries.create, input)).rejects.toThrow(
    'NOT_FOUND',
  );
  await expect(
    owner.mutation(app.api.companies.remove, { companyId }),
  ).rejects.toThrow('HAS_RELATED_RECORDS');
  expect(await t.run((ctx) => ctx.db.query('entries').collect())).toHaveLength(
    1,
  );
});
test('public validators reject server-owned metadata', async () => {
  const { owner, input } = await setup();
  await expect(
    owner.mutation(app.api.entries.create, {
      ...input,
      ...{ revision: 200, userId: 'forged' },
    }),
  ).rejects.toThrow();
});

test('project entry browsing isolates General, named projects, other users and Trash', async () => {
  const { owner, stranger, companyId, input, entry } = await setup();
  const projectId = await owner.mutation(app.api.projects.create, {
    companyId,
    name: 'Named project',
  });
  const named = await owner.mutation(app.api.entries.create, {
    ...input,
    projectId,
    creationKey: 'named-entry-create-key-0001',
  });
  const generalEntries = await owner.query(app.api.entries.list, {
    ...page,
    projectId: input.projectId,
  });
  expect(generalEntries.page.map((item) => item._id)).toEqual([entry._id]);
  await owner.mutation(app.api.projects.setStatus, {
    projectId,
    status: 'archived',
  });
  expect(
    (await owner.query(app.api.entries.list, { ...page, projectId })).page.map(
      (item) => item._id,
    ),
  ).toEqual([named._id]);
  await expect(
    stranger.query(app.api.entries.list, {
      ...page,
      projectId: input.projectId,
    }),
  ).rejects.toThrow('NOT_FOUND');
  await owner.mutation(app.api.entries.discard, {
    entryId: entry._id,
    expectedRevision: 1,
    writeId: 'discard-filtered-entry-0001',
  });
  expect(
    (
      await owner.query(app.api.entries.list, {
        ...page,
        projectId: input.projectId,
      })
    ).page,
  ).toEqual([]);
});

test('project draft filtering applies before pagination and excludes completed work', async () => {
  const { owner, input, entry, payload } = await setup();
  const second = await owner.mutation(app.api.entries.create, {
    ...input,
    creationKey: 'second-project-draft-key-0001',
  });
  const completed = await owner.mutation(app.api.entries.create, {
    ...input,
    creationKey: 'complete-project-entry-key-0001',
  });
  await owner.mutation(app.api.entries.complete, {
    ...payload,
    entryId: completed._id,
    expectedRevision: 1,
    writeId: 'complete-filtered-entry-0001',
    task: 'Shipped',
    whatIDid: 'Fixed a bug',
    date: '2026-11-26',
  });
  const first = await owner.query(app.api.entries.list, {
    projectId: input.projectId,
    draftsOnly: true,
    paginationOpts: { cursor: null, numItems: 1 },
  });
  const next = await owner.query(app.api.entries.list, {
    projectId: input.projectId,
    draftsOnly: true,
    paginationOpts: { cursor: first.continueCursor, numItems: 1 },
  });
  expect(
    new Set([...first.page, ...next.page].map((item) => item._id)),
  ).toEqual(new Set([entry._id, second._id]));
});

test('competing saves from the same revision cannot silently replace each other', async () => {
  const { owner, payload, entry } = await setup();
  const results = await Promise.allSettled([
    owner.mutation(app.api.entries.update, {
      ...payload,
      task: 'First device',
    }),
    owner.mutation(app.api.entries.update, {
      ...payload,
      task: 'Second device',
      writeId: 'competing-update-key-0001',
    }),
  ]);
  expect(
    results.filter((result) => result.status === 'fulfilled'),
  ).toHaveLength(1);
  expect(results.filter((result) => result.status === 'rejected')).toHaveLength(
    1,
  );
  expect(
    (await owner.query(app.api.entries.get, { entryId: entry._id }))?.entry
      .revision,
  ).toBe(2);
});
