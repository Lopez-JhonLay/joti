import type { Doc } from '../convex/_generated/dataModel';
import {
  EMPTY_ENTRY,
  entryDraftSchema,
  entryFingerprint,
  type EntryFormValues,
} from './entry-validation';
import type { EntryOrganization } from '../types/entries';

export function newEntryRequestId() {
  // Uniqueness only: this identifier is never an authorization credential.
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}
export function entrySnapshot(
  values: EntryFormValues,
  organization: EntryOrganization,
) {
  return {
    ...entryDraftSchema.parse({ ...EMPTY_ENTRY, ...values }),
    companyId: organization.companyId,
    projectId: organization.projectId,
  };
}
export type EntrySnapshot = ReturnType<typeof entrySnapshot>;
type Entry = Doc<'entries'>;
export type EntrySaveState = {
  phase: 'idle' | 'dirty' | 'saving' | 'saved' | 'failed' | 'conflict';
  error?: string;
  entry: Entry | null;
  finished?: 'complete' | 'discard';
};
export type EntryPersistence = {
  create: (snapshot: EntrySnapshot, key: string) => Promise<Entry>;
  update: (
    entry: Entry,
    snapshot: EntrySnapshot,
    key: string,
  ) => Promise<Entry>;
  complete: (
    entry: Entry,
    snapshot: EntrySnapshot,
    key: string,
  ) => Promise<Entry>;
  discard: (entry: Entry, key: string) => Promise<Entry>;
};
type Job = {
  kind: keyof EntryPersistence;
  snapshot: EntrySnapshot;
  key: string;
  base: Entry | null;
};

// A single serialized queue owns revisions and retries. React never starts a
// second write with a revision captured before the first write acknowledged.
export class EntrySaveQueue {
  state: EntrySaveState;
  private current: EntrySnapshot | null = null;
  private acknowledged = '';
  private pending: Job | null = null;
  private running: Promise<void> | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private disposed = false;
  private terminal = false;
  private unsavable = false;
  private connectivityOverride?: boolean;
  private creationKey = newEntryRequestId();
  constructor(
    private persistence: EntryPersistence,
    private connected: () => boolean,
    private changed: (state: EntrySaveState) => void,
    initial: Entry | null = null,
    private delay = 700,
  ) {
    this.state = { phase: initial ? 'saved' : 'idle', entry: initial };
    if (initial) {
      this.current = entrySnapshot(initial, initial);
      this.acknowledged = JSON.stringify(this.current);
    }
  }
  private emit(patch: Partial<EntrySaveState>) {
    this.state = { ...this.state, ...patch };
    if (!this.disposed) this.changed(this.state);
  }
  get dirty() {
    return (
      this.unsavable ||
      !!this.pending ||
      (!!this.current && JSON.stringify(this.current) !== this.acknowledged)
    );
  }
  setValues(values: EntryFormValues, organization: EntryOrganization | null) {
    if (this.disposed || this.terminal || this.state.finished) return;
    this.cancelTimer();
    if (!organization) {
      let hasChanges = true;
      try {
        hasChanges = entryFingerprint(values) !== entryFingerprint(EMPTY_ENTRY);
      } catch {
        /* Invalid local text must remain visible until corrected. */
      }
      this.unsavable = !!this.state.entry || hasChanges;
      this.current = null;
      this.emit({ phase: this.unsavable ? 'dirty' : 'idle' });
      return;
    }
    const wasUnsavable = this.unsavable;
    try {
      this.current = entrySnapshot(values, organization);
      this.unsavable = false;
    } catch {
      this.current = null;
      this.unsavable = true;
      this.emit({
        phase: 'failed',
        error: 'Check the date and field lengths before saving.',
      });
      return;
    }
    if (wasUnsavable && !this.pending)
      this.emit({ phase: 'dirty', error: undefined });
    if (
      this.running ||
      this.pending ||
      this.state.phase === 'conflict' ||
      this.state.phase === 'failed'
    )
      return;
    if (!this.dirty) {
      this.emit({ phase: 'saved', error: undefined });
      return;
    }
    this.emit({ phase: 'dirty' });
    this.timer = setTimeout(() => {
      void this.save().catch(() => {});
    }, this.delay);
  }
  private cancelTimer() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }
  private async attempt(job: Job) {
    this.pending = job;
    if (!(this.connectivityOverride ?? this.connected())) {
      this.emit({
        phase: 'failed',
        error: 'Reconnect, then retry to save your changes.',
      });
      throw new Error('Offline');
    }
    this.emit({ phase: 'saving', error: undefined });
    try {
      const result =
        job.kind === 'create'
          ? await this.persistence.create(job.snapshot, job.key)
          : job.base
            ? job.kind === 'discard'
              ? await this.persistence.discard(job.base, job.key)
              : await this.persistence[job.kind](
                  job.base,
                  job.snapshot,
                  job.key,
                )
            : null;
      if (!result) throw new Error('No saved entry');
      if (job.kind === 'create' && result.revision > 1) {
        this.emit({ entry: result });
        throw Object.assign(new Error('Recovered draft changed elsewhere'), {
          data: { code: 'CONFLICT' },
        });
      }
      this.pending = null;
      this.acknowledged = JSON.stringify(entrySnapshot(result, result));
      this.emit({
        phase:
          job.kind === 'discard'
            ? 'saved'
            : this.unsavable
              ? 'failed'
              : JSON.stringify(this.current) !== this.acknowledged
                ? 'dirty'
                : 'saved',
        error:
          this.unsavable && job.kind !== 'discard'
            ? 'Choose valid organization and field values before saving.'
            : undefined,
        entry: result,
        finished:
          job.kind === 'discard'
            ? 'discard'
            : job.kind === 'complete' &&
                !this.unsavable &&
                JSON.stringify(job.snapshot) === JSON.stringify(this.current)
              ? 'complete'
              : undefined,
      });
    } catch (error) {
      const code =
        typeof error === 'object' &&
        error !== null &&
        'data' in error &&
        typeof error.data === 'object' &&
        error.data !== null &&
        'code' in error.data
          ? error.data.code
          : undefined;
      this.emit({
        phase: code === 'CONFLICT' ? 'conflict' : 'failed',
        error:
          code === 'CONFLICT'
            ? 'This entry changed elsewhere. Your text is still here. Reload the latest version before saving.'
            : 'Save failed. Your changes are still here. Check your connection and retry.',
      });
      throw error;
    }
  }
  private save(): Promise<void> {
    if (this.running) return this.running;
    if (this.disposed || this.state.finished) return Promise.resolve();
    if (!this.current && !this.pending)
      return Promise.reject(
        new Error('Choose a company and project/category.'),
      );
    if (this.state.phase === 'conflict')
      return Promise.reject(new Error('Reload latest entry.'));
    const job = this.pending ?? {
      kind: this.state.entry ? 'update' : 'create',
      snapshot: this.current!,
      key: this.state.entry ? newEntryRequestId() : this.creationKey,
      base: this.state.entry,
    };
    this.running = this.attempt(job).finally(() => {
      this.running = null;
      if (
        !this.disposed &&
        !this.pending &&
        !this.terminal &&
        !this.state.finished &&
        this.dirty
      ) {
        this.timer = setTimeout(() => {
          void this.save().catch(() => {});
        }, this.delay);
      }
    });
    return this.running;
  }
  async flush() {
    this.cancelTimer();
    if (this.state.phase === 'failed' || this.state.phase === 'conflict')
      throw new Error(this.state.error);
    if (this.running) await this.running;
    while (this.dirty && !this.disposed) {
      await this.save();
      this.cancelTimer();
    }
    if (!this.current)
      throw new Error('Choose a company and project/category.');
    return this.state.entry;
  }
  async retry() {
    if (this.state.phase === 'conflict' || this.state.finished) return;
    if (this.unsavable) throw new Error('Check the form before retrying.');
    const completing = this.pending?.kind === 'complete';
    this.emit({ phase: 'dirty', error: undefined });
    await this.save();
    if (!this.state.finished) {
      await this.flush();
      if (completing && this.state.entry?.status === 'completed')
        this.emit({ finished: 'complete' });
    }
  }
  async finish(kind: 'complete' | 'discard') {
    if (this.terminal || this.state.finished) return;
    this.terminal = true;
    try {
      if (kind === 'discard') {
        this.cancelTimer();
        if (this.state.phase === 'conflict')
          throw new Error('Reload latest entry before discarding.');
        if (this.running) await this.running;
        if (this.pending) await this.save();
        const saved = this.state.entry;
        if (!saved) {
          this.emit({ finished: 'discard', phase: 'saved' });
          return;
        }
        const job: Job = {
          kind,
          snapshot: entrySnapshot(saved, saved),
          key: newEntryRequestId(),
          base: saved,
        };
        this.running = this.attempt(job).finally(() => {
          this.running = null;
        });
        await this.running;
        return;
      }
      const entry = await this.flush();
      if (!entry || !this.current)
        throw new Error('Save the draft before continuing.');
      const job: Job = {
        kind,
        snapshot: this.current,
        key: newEntryRequestId(),
        base: entry,
      };
      this.running = this.attempt(job).finally(() => {
        this.running = null;
      });
      await this.running;
    } finally {
      this.terminal = false;
    }
  }
  activate() {
    this.disposed = false;
  }
  setConnected(connected: boolean) {
    this.connectivityOverride = connected;
  }
  dispose() {
    this.disposed = true;
    this.cancelTimer();
  }
}
