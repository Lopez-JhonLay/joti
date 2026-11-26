import type { Doc, Id } from '../convex/_generated/dataModel';
import {
  EntrySaveQueue,
  entrySnapshot,
  type EntryPersistence,
  type EntrySnapshot,
} from '../lib/entry-save-queue';
import { EMPTY_ENTRY } from '../lib/entry-validation';

const organization = {
  companyId: 'company' as Id<'companies'>,
  projectId: 'project' as Id<'projects'>,
};
const initial: Doc<'entries'> = {
  _id: 'entry' as Id<'entries'>,
  _creationTime: 1,
  userId: 'owner' as Id<'users'>,
  ...organization,
  status: 'draft',
  impactCategories: [],
  impactStatus: 'pending',
  revision: 1,
  createdAt: 1,
  updatedAt: 1,
};
const values = (task: string) => ({ ...EMPTY_ENTRY, task });
function fixture(existing: Doc<'entries'> | null = null) {
  let connected = true;
  const changed = jest.fn();
  const persistence = {
    create: jest.fn(
      async (snapshot: EntrySnapshot): Promise<Doc<'entries'>> => ({
        ...initial,
        ...snapshot,
      }),
    ),
    update: jest.fn(async (entry: Doc<'entries'>, snapshot: EntrySnapshot) => ({
      ...entry,
      ...snapshot,
      revision: entry.revision + 1,
    })),
    complete: jest.fn(
      async (entry: Doc<'entries'>, snapshot: EntrySnapshot) => ({
        ...entry,
        ...snapshot,
        status: 'completed' as const,
        revision: entry.revision + 1,
      }),
    ),
    discard: jest.fn(async (entry: Doc<'entries'>) => ({
      ...entry,
      deletedAt: 20,
      revision: entry.revision + 1,
    })),
  } satisfies EntryPersistence;
  const queue = new EntrySaveQueue(
    persistence,
    () => connected,
    changed,
    existing,
  );
  return {
    queue,
    persistence,
    changed,
    offline: () => {
      connected = false;
    },
    online: () => {
      connected = true;
    },
  };
}
beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());
test('debounces rapid typing into one persisted draft and skips unchanged values', async () => {
  const { queue, persistence } = fixture();
  queue.setValues(values('A'), organization);
  await jest.advanceTimersByTimeAsync(400);
  queue.setValues(values('AB'), organization);
  await jest.advanceTimersByTimeAsync(699);
  expect(persistence.create).not.toHaveBeenCalled();
  await jest.advanceTimersByTimeAsync(1);
  expect(persistence.create).toHaveBeenCalledTimes(1);
  expect(queue.state).toMatchObject({ phase: 'saved', entry: { task: 'AB' } });
  queue.setValues(values('AB'), organization);
  await jest.advanceTimersByTimeAsync(1000);
  expect(persistence.update).not.toHaveBeenCalled();
  queue.dispose();
});
test('serializes typing during an in-flight save using its acknowledged revision', async () => {
  const { queue, persistence } = fixture();
  let resolve!: (entry: Doc<'entries'>) => void;
  persistence.create.mockImplementationOnce(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  queue.setValues(values('First'), organization);
  await jest.advanceTimersByTimeAsync(700);
  queue.setValues(values('Latest'), organization);
  expect(persistence.update).not.toHaveBeenCalled();
  resolve({ ...initial, ...entrySnapshot(values('First'), organization) });
  await queue.flush();
  expect(persistence.update).toHaveBeenCalledWith(
    expect.objectContaining({ revision: 1 }),
    expect.objectContaining({ task: 'Latest' }),
    expect.any(String),
  );
  expect(queue.state.entry).toMatchObject({ task: 'Latest', revision: 2 });
  queue.dispose();
});
test('lost creation response retries the same key instead of creating another draft', async () => {
  const { queue, persistence } = fixture();
  persistence.create.mockRejectedValueOnce(new Error('Response lost'));
  queue.setValues(values('First'), organization);
  await jest.advanceTimersByTimeAsync(700);
  expect(queue.state.phase).toBe('failed');
  queue.setValues(values('Edited after failure'), organization);
  await queue.retry();
  expect(persistence.create.mock.calls[0]).toEqual(
    persistence.create.mock.calls[1],
  );
  expect(queue.state.entry?.task).toBe('Edited after failure');
  expect(queue.state.phase).toBe('saved');
  queue.dispose();
});
test('offline writes remain visibly unsaved until an explicit successful retry', async () => {
  const { queue, persistence, offline, online } = fixture();
  offline();
  queue.setValues(values('Offline text'), organization);
  await jest.advanceTimersByTimeAsync(700);
  expect(persistence.create).not.toHaveBeenCalled();
  expect(queue.state.phase).toBe('failed');
  online();
  await queue.retry();
  expect(queue.state.entry?.task).toBe('Offline text');
  queue.dispose();
});
test('server conflict preserves local intent and cannot be retried over another revision', async () => {
  const { queue, persistence } = fixture(initial);
  persistence.update.mockRejectedValueOnce({ data: { code: 'CONFLICT' } });
  queue.setValues(values('My edits'), organization);
  await jest.advanceTimersByTimeAsync(700);
  expect(queue.state.phase).toBe('conflict');
  expect(queue.dirty).toBe(true);
  await queue.retry();
  expect(persistence.update).toHaveBeenCalledTimes(1);
  expect(queue.state.entry).toEqual(initial);
  queue.dispose();
});
test('completion flushes current text before validating the latest acknowledged revision', async () => {
  const { queue, persistence } = fixture(initial);
  queue.setValues(
    { ...values('Latest title'), date: '2026-11-25', whatIDid: 'Fixed bug' },
    organization,
  );
  await queue.finish('complete');
  expect(persistence.complete).toHaveBeenCalledWith(
    expect.objectContaining({ revision: 2 }),
    expect.objectContaining({ task: 'Latest title' }),
    expect.any(String),
  );
  expect(queue.state.finished).toBe('complete');
  queue.dispose();
});
test('failed completion is retried as completion with the same request and signals success afterward', async () => {
  const { queue, persistence } = fixture(initial);
  persistence.complete.mockRejectedValueOnce(new Error('Lost response'));
  queue.setValues(initial, organization);
  await expect(queue.finish('complete')).rejects.toThrow();
  expect(queue.state.finished).toBeUndefined();
  await queue.retry();
  expect(persistence.complete.mock.calls[0]).toEqual(
    persistence.complete.mock.calls[1],
  );
  expect(queue.state.finished).toBe('complete');
  queue.dispose();
});
test('invalid text never becomes saved and can be corrected without losing the form', async () => {
  const { queue, persistence } = fixture(initial);
  queue.setValues(values('x'.repeat(201)), organization);
  expect(queue.state.phase).toBe('failed');
  await expect(queue.retry()).rejects.toThrow();
  expect(persistence.update).not.toHaveBeenCalled();
  queue.setValues(values('Corrected'), organization);
  await queue.flush();
  expect(queue.state.entry?.task).toBe('Corrected');
  queue.dispose();
});

test('invalid local fields before organization selection remain unsaved without throwing out the form', () => {
  const { queue } = fixture();
  expect(() => queue.setValues(values('x'.repeat(201)), null)).not.toThrow();
  expect(queue.dirty).toBe(true);
  expect(queue.state.phase).not.toBe('saved');
  queue.dispose();
});

test('edits after a failed completion are saved before retry navigates away', async () => {
  const { queue, persistence } = fixture(initial);
  persistence.complete.mockRejectedValueOnce(new Error('Lost response'));
  queue.setValues(values('Original title'), organization);
  await expect(queue.finish('complete')).rejects.toThrow();
  queue.setValues(values('Edited after completion failure'), organization);
  await queue.retry();
  expect(queue.state.finished).toBe('complete');
  expect(queue.state.entry?.task).toBe('Edited after completion failure');
  queue.dispose();
});

test('recovering a creation response that another client already edited requires conflict resolution', async () => {
  const { queue, persistence } = fixture();
  persistence.create.mockResolvedValueOnce({
    ...initial,
    task: 'Other device edit',
    revision: 2,
  });
  queue.setValues(values('My creation'), organization);
  await jest.advanceTimersByTimeAsync(700);
  expect(queue.state.phase).toBe('conflict');
  expect(persistence.update).not.toHaveBeenCalled();
  queue.dispose();
});
test('discard can abandon invalid local fields without saving them', async () => {
  const { queue, persistence } = fixture(initial);
  queue.setValues(values('x'.repeat(201)), organization);
  await queue.finish('discard');
  expect(persistence.update).not.toHaveBeenCalled();
  expect(queue.state.finished).toBe('discard');
  queue.dispose();
});
test('unmount cancels debounce and ignores late completion notifications', async () => {
  const { queue, persistence, changed } = fixture();
  queue.setValues(values('Pending'), organization);
  queue.dispose();
  await jest.advanceTimersByTimeAsync(1000);
  expect(persistence.create).not.toHaveBeenCalled();
  const running = fixture();
  let resolve!: (entry: Doc<'entries'>) => void;
  running.persistence.create.mockImplementationOnce(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  running.queue.setValues(values('In flight'), organization);
  await jest.advanceTimersByTimeAsync(700);
  running.queue.dispose();
  running.changed.mockClear();
  resolve(initial);
  await Promise.resolve();
  await Promise.resolve();
  expect(running.changed).not.toHaveBeenCalled();
  expect(changed).toHaveBeenCalled();
});
