import { useCallback, useEffect, useState } from 'react';
import { useConvexConnectionState, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Doc } from '@/convex/_generated/dataModel';
import type { EntryFormValues } from '@/lib/entry-validation';
import { EntrySaveQueue, type EntrySaveState } from '@/lib/entry-save-queue';
import type { EntryOrganization } from '@/components/journal/entry-organization-selector';

export function useEntryAutosave(initial: Doc<'entries'> | null) {
  const create = useMutation(api.entries.create);
  const update = useMutation(api.entries.update);
  const complete = useMutation(api.entries.complete);
  const discard = useMutation(api.entries.discard);
  const { isWebSocketConnected } = useConvexConnectionState();
  const [state, setState] = useState<EntrySaveState>({
    phase: initial ? 'saved' : 'idle',
    entry: initial,
  });
  const [queue] = useState(
    () =>
      new EntrySaveQueue(
        {
          create: (snapshot, creationKey) =>
            create({ ...snapshot, creationKey }),
          update: (entry, snapshot, writeId) =>
            update({
              ...snapshot,
              entryId: entry._id,
              expectedRevision: entry.revision,
              writeId,
            }),
          complete: (entry, snapshot, writeId) =>
            complete({
              ...snapshot,
              entryId: entry._id,
              expectedRevision: entry.revision,
              writeId,
            }),
          discard: (entry, writeId) =>
            discard({
              entryId: entry._id,
              expectedRevision: entry.revision,
              writeId,
            }),
        },
        () => true,
        setState,
        initial,
      ),
  );
  useEffect(() => {
    queue.activate();
    return () => queue.dispose();
  }, [queue]);
  useEffect(() => {
    queue.setConnected(isWebSocketConnected);
  }, [queue, isWebSocketConnected]);
  const change = useCallback(
    (values: EntryFormValues, organization: EntryOrganization | null) =>
      queue.setValues(values, organization),
    [queue],
  );
  return { state, queue, change, connected: isWebSocketConnected };
}
