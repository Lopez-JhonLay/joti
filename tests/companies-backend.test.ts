import { getAuthUserId } from '@convex-dev/auth/server';
import type { Doc, Id } from '../convex/_generated/dataModel';
import type { MutationCtx } from '../convex/_generated/server';
import type { RegisteredMutation, RegisteredQuery } from 'convex/server';
import * as functions from '../convex/companies';

// Convex retains _handler at runtime but omits this internal property from its
// published declarations. Keep the test-only assertion typed by each function.
function withHandler<Args extends Record<string, unknown>, Returns>(
  registered:
    | RegisteredMutation<'public', Args, Returns>
    | RegisteredQuery<'public', Args, Returns>,
) {
  return registered as typeof registered & {
    _handler: (ctx: MutationCtx, args: Args) => Returns;
  };
}
const create = withHandler(functions.create);
const get = withHandler(functions.get);
const list = withHandler(functions.list);
const remove = withHandler(functions.remove);
const update = withHandler(functions.update);

jest.mock('@convex-dev/auth/server', () => ({ getAuthUserId: jest.fn() }));
const getUserId = jest.mocked(getAuthUserId);
const owner = 'owner' as Id<'users'>;
const stranger = 'stranger' as Id<'users'>;
const companyId = 'company' as Id<'companies'>;
const foreignId = 'foreign-company' as Id<'companies'>;
const company: Doc<'companies'> = {
  _id: companyId,
  _creationTime: 1,
  name: 'Acme',
  userId: owner,
  jobTitle: 'Developer',
  startDate: '2024-01-01',
  endDate: '2025-01-01',
  createdAt: 1,
  updatedAt: 1,
};
const companies = new Map<string, Doc<'companies'>>();
const projects: Doc<'projects'>[] = [];

// Exercise the registered handlers with a reader that actually applies index
// equality predicates, so omitting the ownership filter exposes foreign rows.
const db = {
  get: jest.fn(async (_table: string, id: string) => companies.get(id) ?? null),
  insert: jest.fn(
    async (
      table: string,
      values:
        | Omit<Doc<'companies'>, '_id' | '_creationTime'>
        | Omit<Doc<'projects'>, '_id' | '_creationTime'>,
    ) => {
      if (table === 'projects' && 'companyId' in values) {
        const id = 'general' as Id<'projects'>;
        projects.push({ ...values, _id: id, _creationTime: 1 });
        return id;
      }
      if ('companyId' in values) throw new Error('Invalid test company');
      companies.set(companyId, { ...values, _id: companyId, _creationTime: 1 });
      return companyId;
    },
  ),
  patch: jest.fn(
    async (_table: string, id: string, values: Partial<Doc<'companies'>>) => {
      const original = companies.get(id);
      if (!original) throw new Error('Missing test company');
      companies.set(id, { ...original, ...values });
    },
  ),
  delete: jest.fn(async (table: string, id: string) => {
    if (table === 'projects') {
      const index = projects.findIndex((project) => project._id === id);
      if (index >= 0) projects.splice(index, 1);
    } else companies.delete(id);
  }),
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
        : table === 'projects'
          ? projects
          : []
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
      paginate: async (opts: { numItems: number; cursor: string | null }) => {
        const offset = Number(opts.cursor ?? 0);
        const filtered = rows();
        return {
          page: filtered.slice(offset, offset + opts.numItems),
          isDone: offset + opts.numItems >= filtered.length,
          continueCursor: String(offset + opts.numItems),
        };
      },
      first: async () => rows()[0] ?? null,
      unique: async () => {
        const matches = rows();
        if (matches.length > 1) throw new Error('Duplicate test records');
        return matches[0] ?? null;
      },
    };
    return reader;
  }),
};
const ctx = { db } as unknown as MutationCtx;
const unavailable = { data: { code: 'NOT_FOUND' } };

beforeEach(() => {
  jest.clearAllMocks();
  getUserId.mockResolvedValue(owner);
  companies.clear();
  companies.set(companyId, { ...company });
  companies.set(foreignId, { ...company, _id: foreignId, userId: stranger });
  projects.length = 0;
});

test('all company endpoints reject signed-out requests', async () => {
  getUserId.mockResolvedValue(null);
  const denied = { data: { code: 'UNAUTHENTICATED' } };
  await expect(
    list._handler(ctx, { paginationOpts: { numItems: 20, cursor: null } }),
  ).rejects.toMatchObject(denied);
  await expect(get._handler(ctx, { companyId })).rejects.toMatchObject(denied);
  await expect(create._handler(ctx, { name: 'New' })).rejects.toMatchObject(
    denied,
  );
  await expect(
    update._handler(ctx, { companyId, name: 'New' }),
  ).rejects.toMatchObject(denied);
  await expect(remove._handler(ctx, { companyId })).rejects.toMatchObject(
    denied,
  );
  expect(db.insert).not.toHaveBeenCalled();
  expect(db.patch).not.toHaveBeenCalled();
  expect(db.delete).not.toHaveBeenCalled();
});

test('listing applies ownership before pagination', async () => {
  const secondId = 'second' as Id<'companies'>;
  companies.set(secondId, { ...company, _id: secondId });
  const first = await list._handler(ctx, {
    paginationOpts: { numItems: 1, cursor: null },
  });
  expect(first.page).toEqual([company]);
  expect(first.isDone).toBe(false);
  const second = await list._handler(ctx, {
    paginationOpts: { numItems: 1, cursor: first.continueCursor },
  });
  expect(second.page.map((row) => row._id)).toEqual([secondId]);
  expect(second.isDone).toBe(true);
});

test('detail reads never reveal foreign or missing companies', async () => {
  await expect(get._handler(ctx, { companyId })).resolves.toEqual(company);
  await expect(get._handler(ctx, { companyId: foreignId })).resolves.toBeNull();
  companies.delete(companyId);
  await expect(get._handler(ctx, { companyId })).resolves.toBeNull();
});

test('creation normalizes fields and derives ownership and timestamps on the server', async () => {
  await create._handler(ctx, {
    name: '  New company  ',
    jobTitle: ' Engineer ',
    startDate: '2024-02-29',
    endDate: ' ',
  });
  expect(companies.get(companyId)).toMatchObject({
    name: 'New company',
    jobTitle: 'Engineer',
    startDate: '2024-02-29',
    endDate: undefined,
    userId: owner,
    createdAt: expect.any(Number),
    updatedAt: expect.any(Number),
  });
});

test.each([
  { name: '   ' },
  { name: 'x'.repeat(201) },
  { name: 'Acme', startDate: '2023-02-29' },
  { name: 'Acme', endDate: '2024-04-31' },
  { name: 'Acme', startDate: '2025-01-02', endDate: '2025-01-01' },
])(
  'invalid company values cannot be created or updated: %j',
  async (values) => {
    const expected = { data: { code: 'VALIDATION_ERROR' } };
    await expect(create._handler(ctx, values)).rejects.toMatchObject(expected);
    await expect(
      update._handler(ctx, { ...values, companyId }),
    ).rejects.toMatchObject(expected);
    expect(db.insert).not.toHaveBeenCalled();
    expect(db.patch).not.toHaveBeenCalled();
  },
);

test('editing preserves creation metadata and clears optional fields', async () => {
  await update._handler(ctx, {
    companyId,
    name: ' Renamed ',
    jobTitle: '',
    startDate: '',
    endDate: '',
  });
  expect(companies.get(companyId)).toMatchObject({
    name: 'Renamed',
    userId: owner,
    createdAt: 1,
    jobTitle: undefined,
    startDate: undefined,
    endDate: undefined,
  });
});

test('optional fields omitted by Convex serialization are cleared on full-form updates', async () => {
  await update._handler(ctx, { companyId, name: 'Acme' });
  expect(db.patch).toHaveBeenCalledWith('companies', companyId, {
    name: 'Acme',
    jobTitle: undefined,
    startDate: undefined,
    endDate: undefined,
    updatedAt: expect.any(Number),
  });
});

test('foreign and missing companies cannot be edited or deleted', async () => {
  for (const id of [foreignId, 'missing' as Id<'companies'>]) {
    await expect(
      update._handler(ctx, { companyId: id, name: 'Stolen' }),
    ).rejects.toMatchObject(unavailable);
    await expect(remove._handler(ctx, { companyId: id })).rejects.toMatchObject(
      unavailable,
    );
  }
  expect(db.patch).not.toHaveBeenCalled();
  expect(db.delete).not.toHaveBeenCalled();
});

test.each([
  { status: 'active', isGeneral: false },
  { status: 'archived', isGeneral: false },
] as const)('related projects block deletion even for %j', async (values) => {
  projects.push({
    _id: 'project' as Id<'projects'>,
    _creationTime: 1,
    userId: owner,
    companyId,
    name: 'Project',
    createdAt: 1,
    updatedAt: 1,
    ...values,
  });
  await expect(remove._handler(ctx, { companyId })).rejects.toMatchObject({
    data: { code: 'HAS_RELATED_RECORDS' },
  });
  expect(db.delete).not.toHaveBeenCalled();
});

test('unrelated projects do not block deletion of an empty company', async () => {
  projects.push({
    _id: 'project' as Id<'projects'>,
    _creationTime: 1,
    userId: stranger,
    companyId: foreignId,
    name: 'Other project',
    createdAt: 1,
    updatedAt: 1,
    status: 'active',
    isGeneral: false,
  });
  await remove._handler(ctx, { companyId });
  expect(companies.has(companyId)).toBe(false);
  expect(companies.has(foreignId)).toBe(true);
});

test('company creation provisions its owned built-in category in the same handler', async () => {
  await create._handler(ctx, { name: 'New company' });
  expect(projects).toHaveLength(1);
  expect(projects[0]).toMatchObject({
    companyId,
    userId: owner,
    name: 'General / Adhoc',
    isGeneral: true,
    status: 'active',
  });
});

test('confirmed empty-company deletion removes only its built-in category and parent', async () => {
  await create._handler(ctx, { name: 'New company' });
  await remove._handler(ctx, { companyId });
  expect(projects).toHaveLength(0);
  expect(companies.has(companyId)).toBe(false);
  expect(db.delete).toHaveBeenNthCalledWith(1, 'projects', 'general');
  expect(db.delete).toHaveBeenNthCalledWith(2, 'companies', companyId);
});

test('named projects still block deleting the company or its built-in category', async () => {
  await create._handler(ctx, { name: 'New company' });
  projects.push({
    ...projects[0],
    _id: 'named' as Id<'projects'>,
    name: 'Atlas',
    isGeneral: false,
  });
  await expect(remove._handler(ctx, { companyId })).rejects.toMatchObject({
    data: { code: 'HAS_RELATED_RECORDS' },
  });
  expect(projects).toHaveLength(2);
  expect(db.delete).not.toHaveBeenCalled();
});

test('an inconsistent foreign built-in category blocks parent deletion', async () => {
  await create._handler(ctx, { name: 'New company' });
  projects[0] = { ...projects[0], userId: stranger };
  await expect(remove._handler(ctx, { companyId })).rejects.toMatchObject(
    unavailable,
  );
  expect(db.delete).not.toHaveBeenCalled();
});
