import { getAuthUserId } from '@convex-dev/auth/server';
import type { RegisteredMutation, RegisteredQuery } from 'convex/server';
import type { Doc, Id } from '../convex/_generated/dataModel';
import type { MutationCtx } from '../convex/_generated/server';
import * as functions from '../convex/projects';
import * as migrations from '../convex/general_projects';

function withHandler<
  Visibility extends 'public' | 'internal',
  Args extends Record<string, unknown>,
  Returns,
>(
  registered:
    | RegisteredMutation<Visibility, Args, Returns>
    | RegisteredQuery<Visibility, Args, Returns>,
) {
  // Convex's runtime handler is internal and omitted from published declarations.
  return registered as typeof registered & {
    _handler: (ctx: MutationCtx, args: Args) => Returns;
  };
}
const create = withHandler(functions.create);
const get = withHandler(functions.get);
const list = withHandler(functions.list);
const update = withHandler(functions.update);
const setStatus = withHandler(functions.setStatus);
const general = withHandler(functions.general);
const ensureGeneral = withHandler(functions.ensureGeneral);
const backfill = withHandler(migrations.backfill);
const audit = withHandler(migrations.audit);

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
  name: 'Acme',
  userId: owner,
  createdAt: 1,
  updatedAt: 1,
};
const project: Doc<'projects'> = {
  _id: projectId,
  _creationTime: 1,
  companyId,
  userId: owner,
  name: 'Atlas',
  description: 'Original description',
  status: 'active',
  isGeneral: false,
  createdAt: 1,
  updatedAt: 1,
};
const companies = new Map<string, Doc<'companies'>>();
const projects = new Map<string, Doc<'projects'>>();
const db = {
  get: jest.fn(async (table: string, id: string) =>
    table === 'companies'
      ? (companies.get(id) ?? null)
      : (projects.get(id) ?? null),
  ),
  insert: jest.fn(
    async (
      _table: string,
      values: Omit<Doc<'projects'>, '_id' | '_creationTime'>,
    ) => {
      const id = values.isGeneral
        ? (`general-${values.companyId}` as Id<'projects'>)
        : projectId;
      projects.set(id, { ...values, _id: id, _creationTime: 1 });
      return id;
    },
  ),
  patch: jest.fn(
    async (_table: string, id: string, values: Partial<Doc<'projects'>>) => {
      const original = projects.get(id);
      if (!original) throw new Error('Missing test project');
      projects.set(id, { ...original, ...values });
    },
  ),
  delete: jest.fn(),
  query: jest.fn((table: string) => {
    const filters: Record<string, unknown> = {};
    const range = {
      eq: (field: string, value: unknown) => {
        filters[field] = value;
        return range;
      },
    };
    const rows = () =>
      (table === 'companies'
        ? [...companies.values()]
        : [...projects.values()]
      ).filter((row) =>
        Object.entries(filters).every(
          ([field, value]) => Reflect.get(row, field) === value,
        ),
      );
    const reader = {
      withIndex: (_name: string, build: (q: typeof range) => unknown) => {
        build(range);
        return reader;
      },
      order: (_direction: string) => reader,
      filter: (
        build: (q: {
          field: (name: string) => string;
          eq: typeof range.eq;
        }) => unknown,
      ) => {
        build({ field: (name) => name, eq: range.eq });
        return reader;
      },
      unique: async () => {
        const matches = rows();
        if (matches.length > 1) throw new Error('Duplicate test records');
        return matches[0] ?? null;
      },
      take: async (count: number) => rows().slice(0, count),
      paginate: async ({
        numItems,
        cursor,
      }: {
        numItems: number;
        cursor: string | null;
      }) => {
        const matches = rows();
        const offset = Number(cursor ?? 0);
        return {
          page: matches.slice(offset, offset + numItems),
          isDone: offset + numItems >= matches.length,
          continueCursor: String(offset + numItems),
        };
      },
    };
    return reader;
  }),
};
const scheduler = { runAfter: jest.fn(async () => 'scheduled') };
const ctx = { db, scheduler } as unknown as MutationCtx;
const paginationOpts = { numItems: 20, cursor: null };
const unavailable = { data: { code: 'NOT_FOUND' } };

beforeEach(() => {
  jest.clearAllMocks();
  getUserId.mockResolvedValue(owner);
  companies.clear();
  projects.clear();
  companies.set(companyId, { ...company });
  companies.set(otherCompanyId, { ...company, _id: otherCompanyId });
  projects.set(projectId, { ...project });
});

test('every project endpoint rejects signed-out access before writing', async () => {
  getUserId.mockResolvedValue(null);
  const denied = { data: { code: 'UNAUTHENTICATED' } };
  await expect(
    list._handler(ctx, { companyId, paginationOpts }),
  ).rejects.toMatchObject(denied);
  await expect(get._handler(ctx, { projectId })).rejects.toMatchObject(denied);
  await expect(general._handler(ctx, { companyId })).rejects.toMatchObject(
    denied,
  );
  await expect(
    ensureGeneral._handler(ctx, { companyId }),
  ).rejects.toMatchObject(denied);
  await expect(
    create._handler(ctx, { companyId, name: 'New' }),
  ).rejects.toMatchObject(denied);
  await expect(
    update._handler(ctx, { projectId, name: 'New', status: 'active' }),
  ).rejects.toMatchObject(denied);
  await expect(
    setStatus._handler(ctx, { projectId, status: 'archived' }),
  ).rejects.toMatchObject(denied);
  expect(db.insert).not.toHaveBeenCalled();
  expect(db.patch).not.toHaveBeenCalled();
});

test('company and owner predicates are applied before project pagination', async () => {
  projects.set('foreign', {
    ...project,
    _id: 'foreign' as Id<'projects'>,
    userId: stranger,
  });
  projects.set('other-company-project', {
    ...project,
    _id: 'other-company-project' as Id<'projects'>,
    companyId: otherCompanyId,
  });
  projects.set('second', {
    ...project,
    _id: 'second' as Id<'projects'>,
    status: 'archived',
  });
  const first = await list._handler(ctx, {
    companyId,
    paginationOpts: { numItems: 1, cursor: null },
  });
  expect(first.page).toEqual([project]);
  expect(first.isDone).toBe(false);
  const second = await list._handler(ctx, {
    companyId,
    paginationOpts: { numItems: 1, cursor: first.continueCursor },
  });
  expect(second.page.map((row) => row._id)).toEqual(['second']);
  expect(second.isDone).toBe(true);
  const active = await list._handler(ctx, {
    companyId,
    status: 'active',
    paginationOpts,
  });
  expect(active.page.map((row) => row._id)).toEqual([projectId]);
  const archived = await list._handler(ctx, {
    companyId,
    status: 'archived',
    paginationOpts,
  });
  expect(archived.page.map((row) => row._id)).toEqual(['second']);
});

test.each(['missing', 'foreign'])(
  'a %s company cannot be listed or receive projects',
  async (state) => {
    if (state === 'missing') companies.delete(companyId);
    else companies.set(companyId, { ...company, userId: stranger });
    await expect(
      list._handler(ctx, { companyId, paginationOpts }),
    ).rejects.toMatchObject(unavailable);
    await expect(
      create._handler(ctx, { companyId, name: 'New' }),
    ).rejects.toMatchObject(unavailable);
    expect(db.insert).not.toHaveBeenCalled();
  },
);

test('creation derives ownership, active status, built-in flag, and timestamps from the server', async () => {
  await create._handler(ctx, {
    companyId,
    name: '  New project ',
    description: ' Description ',
  });
  expect(projects.get(projectId)).toMatchObject({
    name: 'New project',
    description: 'Description',
    companyId,
    userId: owner,
    isGeneral: false,
    status: 'active',
    createdAt: expect.any(Number),
    updatedAt: expect.any(Number),
  });
});

test.each([
  { name: '   ' },
  { name: 'x'.repeat(201) },
  { name: 'Atlas', description: 'x'.repeat(4001) },
])(
  'invalid content is rejected independently by both write endpoints',
  async (input) => {
    const denied = { data: { code: 'VALIDATION_ERROR' } };
    await expect(
      create._handler(ctx, { companyId, ...input }),
    ).rejects.toMatchObject(denied);
    await expect(
      update._handler(ctx, { projectId, status: 'active', ...input }),
    ).rejects.toMatchObject(denied);
    expect(db.insert).not.toHaveBeenCalled();
    expect(db.patch).not.toHaveBeenCalled();
  },
);

test('owned project detail includes only its owned company', async () => {
  await expect(get._handler(ctx, { projectId })).resolves.toEqual({
    project,
    company,
  });
  getUserId.mockResolvedValue(stranger);
  await expect(get._handler(ctx, { projectId })).resolves.toBeNull();
  projects.delete(projectId);
  getUserId.mockResolvedValue(owner);
  await expect(get._handler(ctx, { projectId })).resolves.toBeNull();
});

test.each(['missing', 'foreign'])(
  'an owned project with a %s company cannot be read, edited, or archived',
  async (state) => {
    if (state === 'missing') companies.delete(companyId);
    else companies.set(companyId, { ...company, userId: stranger });
    await expect(get._handler(ctx, { projectId })).resolves.toBeNull();
    await expect(
      update._handler(ctx, { projectId, name: 'New', status: 'active' }),
    ).rejects.toMatchObject(unavailable);
    await expect(
      setStatus._handler(ctx, { projectId, status: 'archived' }),
    ).rejects.toMatchObject(unavailable);
    expect(db.patch).not.toHaveBeenCalled();
  },
);

test.each(['missing', 'foreign'])(
  '%s projects cannot be edited or archived',
  async (state) => {
    if (state === 'missing') projects.delete(projectId);
    else projects.set(projectId, { ...project, userId: stranger });
    await expect(
      update._handler(ctx, { projectId, name: 'New', status: 'active' }),
    ).rejects.toMatchObject(unavailable);
    await expect(
      setStatus._handler(ctx, { projectId, status: 'archived' }),
    ).rejects.toMatchObject(unavailable);
    expect(db.patch).not.toHaveBeenCalled();
  },
);

test('full-form updates clear descriptions omitted during transport and preserve company and owner', async () => {
  await update._handler(ctx, {
    projectId,
    name: ' Renamed ',
    status: 'archived',
  });
  expect(projects.get(projectId)).toMatchObject({
    name: 'Renamed',
    description: undefined,
    status: 'archived',
    companyId,
    userId: owner,
    createdAt: 1,
    isGeneral: false,
  });
});

test('archive and restore change only classification metadata, without deleting or reparenting records', async () => {
  await setStatus._handler(ctx, { projectId, status: 'archived' });
  expect(projects.get(projectId)).toMatchObject({
    ...project,
    status: 'archived',
    updatedAt: expect.any(Number),
  });
  expect(db.patch).toHaveBeenLastCalledWith('projects', projectId, {
    status: 'archived',
    updatedAt: expect.any(Number),
  });
  await expect(get._handler(ctx, { projectId })).resolves.toMatchObject({
    project: { status: 'archived' },
  });
  await setStatus._handler(ctx, { projectId, status: 'active' });
  expect(projects.get(projectId)).toMatchObject({
    ...project,
    updatedAt: expect.any(Number),
  });
  expect(db.delete).not.toHaveBeenCalled();
});

test('repeated status requests are idempotent', async () => {
  await setStatus._handler(ctx, { projectId, status: 'active' });
  expect(db.patch).not.toHaveBeenCalled();
});

test('flagged built-in categories cannot be renamed or archived', async () => {
  projects.set(projectId, { ...project, isGeneral: true });
  const denied = { data: { code: 'VALIDATION_ERROR' } };
  await expect(
    update._handler(ctx, { projectId, name: 'Renamed', status: 'active' }),
  ).rejects.toMatchObject(denied);
  await expect(
    setStatus._handler(ctx, { projectId, status: 'archived' }),
  ).rejects.toMatchObject(denied);
  expect(db.patch).not.toHaveBeenCalled();
});

test('General provisioning is idempotent, scoped per company, and separate from named pagination', async () => {
  const id = await ensureGeneral._handler(ctx, { companyId });
  await expect(ensureGeneral._handler(ctx, { companyId })).resolves.toBe(id);
  expect(db.insert).toHaveBeenCalledTimes(1);
  const category = projects.get(id);
  expect(category).toMatchObject({
    companyId,
    userId: owner,
    name: 'General / Adhoc',
    isGeneral: true,
    status: 'active',
  });
  await expect(general._handler(ctx, { companyId })).resolves.toEqual(category);
  await ensureGeneral._handler(ctx, { companyId: otherCompanyId });
  expect([...projects.values()].filter((row) => row.isGeneral)).toHaveLength(2);
  const named = await list._handler(ctx, {
    companyId,
    namedOnly: true,
    paginationOpts: { numItems: 1, cursor: null },
  });
  expect(named.page.map((row) => row._id)).toEqual([projectId]);
  expect(named.isDone).toBe(true);
});

test.each(['missing', 'foreign'])(
  'General provisioning cannot write into a %s company',
  async (state) => {
    if (state === 'missing') companies.delete(companyId);
    else companies.set(companyId, { ...company, userId: stranger });
    await expect(
      ensureGeneral._handler(ctx, { companyId }),
    ).rejects.toMatchObject(unavailable);
    await expect(general._handler(ctx, { companyId })).rejects.toMatchObject(
      unavailable,
    );
    expect(db.insert).not.toHaveBeenCalled();
  },
);

test('existing flagged categories keep their IDs while canonical name/status are repaired', async () => {
  projects.set(projectId, {
    ...project,
    name: 'Legacy category',
    isGeneral: true,
    status: 'archived',
  });
  await expect(general._handler(ctx, { companyId })).resolves.toBeNull();
  await expect(ensureGeneral._handler(ctx, { companyId })).resolves.toBe(
    projectId,
  );
  expect(projects.get(projectId)).toMatchObject({
    ...project,
    name: 'General / Adhoc',
    isGeneral: true,
    status: 'active',
    updatedAt: expect.any(Number),
  });
  expect(db.insert).not.toHaveBeenCalled();
});

test('a foreign category cannot be adopted or rewritten under an owned company', async () => {
  projects.set(projectId, {
    ...project,
    name: 'General / Adhoc',
    isGeneral: true,
    userId: stranger,
  });
  await expect(general._handler(ctx, { companyId })).resolves.toBeNull();
  await expect(
    ensureGeneral._handler(ctx, { companyId }),
  ).rejects.toMatchObject(unavailable);
  expect(db.insert).not.toHaveBeenCalled();
  expect(db.patch).not.toHaveBeenCalled();
});

test.each(['General / Adhoc', 'general/adhoc', ' GENERAL / ADHOC '])(
  'the built-in name is reserved for server provisioning: %s',
  async (name) => {
    const expected = { data: { code: 'VALIDATION_ERROR' } };
    await expect(
      create._handler(ctx, { companyId, name }),
    ).rejects.toMatchObject(expected);
    await expect(
      update._handler(ctx, { projectId, name, status: 'active' }),
    ).rejects.toMatchObject(expected);
    expect(db.insert).not.toHaveBeenCalled();
    expect(db.patch).not.toHaveBeenCalled();
  },
);

test('backfill is restartable and preserves ordinary pre-existing projects, even legacy same-name records', async () => {
  const legacy = { ...project, name: 'General / Adhoc' };
  projects.set(projectId, legacy);
  await expect(backfill._handler(ctx, { cursor: null })).resolves.toMatchObject(
    { processed: 2, done: true },
  );
  expect([...projects.values()].filter((row) => row.isGeneral)).toHaveLength(2);
  expect(projects.get(projectId)).toEqual(legacy);
  await backfill._handler(ctx, { cursor: null });
  expect(db.insert).toHaveBeenCalledTimes(2);
  expect(db.delete).not.toHaveBeenCalled();
  await expect(audit._handler(ctx, { cursor: null })).resolves.toMatchObject({
    checked: 2,
    missing: 0,
    duplicates: 0,
    invalid: 0,
    done: true,
  });
});

test('backfill schedules bounded continuation pages', async () => {
  for (let index = 0; index < 100; index++) {
    const id = `company-${index}` as Id<'companies'>;
    companies.set(id, { ...company, _id: id });
  }
  const first = await backfill._handler(ctx, { cursor: null });
  expect(first).toMatchObject({ processed: 100, done: false });
  expect(scheduler.runAfter).toHaveBeenCalledWith(0, expect.anything(), {
    cursor: first.nextCursor,
  });
  await expect(
    backfill._handler(ctx, { cursor: first.nextCursor }),
  ).resolves.toMatchObject({ processed: 2, done: true });
  expect([...projects.values()].filter((row) => row.isGeneral)).toHaveLength(
    102,
  );
});

test('duplicate flagged categories fail closed without deleting or merging private records', async () => {
  projects.set(projectId, {
    ...project,
    name: 'General / Adhoc',
    isGeneral: true,
  });
  projects.set('duplicate', {
    ...project,
    _id: 'duplicate' as Id<'projects'>,
    name: 'General / Adhoc',
    isGeneral: true,
  });
  await expect(ensureGeneral._handler(ctx, { companyId })).rejects.toThrow(
    'Duplicate test records',
  );
  await expect(audit._handler(ctx, { cursor: null })).resolves.toMatchObject({
    duplicates: 1,
  });
  expect(db.insert).not.toHaveBeenCalled();
  expect(db.delete).not.toHaveBeenCalled();
});
