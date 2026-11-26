import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Keyboard, View } from 'react-native';
import { router, usePreventRemove } from 'expo-router';
import { useConvex, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Doc, Id } from '@/convex/_generated/dataModel';
import { useAuthSession } from '@/lib/auth-session';
import { useNavigationPreview } from '@/lib/navigation-preview';
import { useEntryAutosave } from '@/hooks/use-entry-autosave';
import { EMPTY_ENTRY, type EntryFormValues } from '@/lib/entry-validation';
import { Button } from '@/components/ui/button';
import { Feedback } from '@/components/ui/feedback';
import { QueryBoundary } from '@/components/ui/query-boundary';
import { ScreenFrame } from '@/components/ui/screen-frame';
import { ChoiceSheet } from '@/components/ui/choice-sheet';
import { Typography } from '@/components/ui/typography';
import { StatusBadge } from '@/components/ui/status-badge';
import { EntryForm } from './entry-form';
import type { EntryOrganization } from './entry-organization-selector';

export function closeEntryEditor() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

function Editor({
  initial,
  onReload,
}: {
  initial: Doc<'entries'> | null;
  onReload: (entryId?: Id<'entries'>) => Promise<void>;
}) {
  const [values, setValues] = useState<EntryFormValues>(initial ?? EMPTY_ENTRY);
  const [organization, setOrganization] = useState<EntryOrganization | null>(
    initial,
  );
  const [busy, setBusy] = useState(false);
  const actionLock = useRef(false);
  const [discarding, setDiscarding] = useState(false);
  const [allowLeave, setAllowLeave] = useState(false);
  const [exitEntry, setExitEntry] = useState<Id<'entries'> | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const { state, queue, change, connected } = useEntryAutosave(initial);
  useEffect(() => {
    change(values, organization);
  }, [values, organization, change]);
  usePreventRemove(
    !allowLeave &&
      !exitEntry &&
      !state.finished &&
      (queue.dirty || state.phase === 'saving' || busy),
    ({ repeat }) => {
      Alert.alert(
        'Leave with unsaved changes?',
        state.phase === 'saving'
          ? 'A save is in progress and may still finish after you leave. Stay to confirm it.'
          : 'Your latest changes have not been saved. Keep editing or leave without them.',
        [
          { text: 'Keep editing', style: 'cancel' },
          {
            text: 'Leave',
            style: 'destructive',
            onPress: () => {
              setAllowLeave(true);
              queue.dispose();
              repeat();
            },
          },
        ],
      );
    },
  );
  useEffect(() => {
    if (state.finished || exitEntry) {
      if (state.finished === 'discard') router.replace('/entries');
      else if (state.entry || exitEntry)
        router.replace({
          pathname: '/entry/[entryId]',
          params: {
            entryId: exitEntry ?? state.entry!._id,
            completed: state.finished === 'complete' ? '1' : '0',
          },
        });
    }
  }, [state.finished, state.entry, allowLeave, exitEntry]);
  const updateValues = useCallback(
    (next: EntryFormValues) => setValues(next),
    [],
  );
  async function action(kind: 'complete' | 'discard' | 'done' | 'retry') {
    if (actionLock.current) return;
    actionLock.current = true;
    if (kind === 'complete' || kind === 'done') Keyboard.dismiss();
    setBusy(true);
    setActionError(null);
    try {
      if (kind === 'retry') await queue.retry();
      else if (kind === 'done') {
        const saved = await queue.flush();
        if (saved) setExitEntry(saved._id);
      } else await queue.finish(kind);
    } catch {
      setActionError(
        'Unable to finish. Keep your changes here, resolve any save error, then try again.',
      );
    } finally {
      actionLock.current = false;
      setBusy(false);
    }
  }
  return (
    <ScreenFrame
      title={initial ? 'Edit entry' : 'New entry'}
      onBack={closeEntryEditor}
      busy={busy}
      busyLabel="Saving entry"
      actions={
        state.phase !== 'idle' ? (
          <View className="items-end gap-1">
            <StatusBadge
              tone={
                state.phase === 'failed' || state.phase === 'conflict'
                  ? 'danger'
                  : state.phase === 'dirty'
                    ? 'warning'
                    : 'info'
              }
              label={
                state.phase === 'saving'
                  ? 'Saving…'
                  : state.phase === 'saved' && !queue.dirty
                    ? state.entry?.status === 'completed'
                      ? 'Saved'
                      : 'Saved as draft'
                    : state.phase === 'dirty'
                      ? 'Unsaved changes'
                      : 'Save failed'
              }
            />
          </View>
        ) : undefined
      }
    >
      {(state.phase === 'failed' ||
        state.phase === 'conflict' ||
        !connected ||
        !!state.error ||
        !!actionError) && (
        <View className="gap-3" accessibilityLiveRegion="polite">
          {!connected && (
            <Feedback message="You’re offline. Reconnect to save; keep this screen open to retain unsaved changes." />
          )}
          {state.error && <Feedback error message={state.error} />}
          {state.phase === 'failed' && (
            <Button
              title="Retry save"
              variant="secondary"
              disabled={!connected || busy}
              onPress={() => {
                void action('retry');
              }}
            />
          )}
          {state.phase === 'conflict' && (
            <Button
              title="Reload latest entry"
              variant="secondary"
              disabled={!connected || busy}
              onPress={() =>
                Alert.alert(
                  'Replace local changes?',
                  'Reloading replaces the unsaved text on this screen with the latest saved entry.',
                  [
                    { text: 'Keep my text', style: 'cancel' },
                    {
                      text: 'Reload latest',
                      style: 'destructive',
                      onPress: () => {
                        void onReload(state.entry?._id).catch(() =>
                          setActionError(
                            'Unable to reload. Your text is still here. Try again.',
                          ),
                        );
                      },
                    },
                  ],
                )
              }
            />
          )}
          {actionError && <Feedback error message={actionError} />}
        </View>
      )}
      <EntryForm
        initialValues={initial ?? undefined}
        initialOrganization={initial ?? undefined}
        existing={!!initial}
        completed={initial?.status === 'completed'}
        busy={busy}
        onChange={updateValues}
        onOrganizationChange={setOrganization}
        onComplete={(next) => {
          change(next, organization);
          void action('complete');
        }}
        onDone={() => {
          void action('done');
        }}
        onDiscard={() => setDiscarding(true)}
      />
      {discarding && (
        <ChoiceSheet
          title="Discard draft?"
          onClose={() => {
            if (!busy) setDiscarding(false);
          }}
        >
          <Typography>
            The saved draft will move to Trash. Unsaved changes will be
            discarded. Trash recovery isn’t available yet.
          </Typography>
          <Button
            title="Keep draft"
            variant="secondary"
            disabled={busy}
            onPress={() => setDiscarding(false)}
          />
          <Button
            title="Discard"
            icon="trash-2"
            disabled={!connected}
            loading={busy}
            onPress={() => {
              void action('discard');
            }}
          />
        </ChoiceSheet>
      )}
    </ScreenFrame>
  );
}

function PrivateEditor({ entryId }: { entryId?: Id<'entries'> }) {
  const result = useQuery(api.entries.get, entryId ? { entryId } : 'skip');
  const convex = useConvex();
  const [reload, setReload] = useState<{
    version: number;
    entry: Doc<'entries'> | null;
  } | null>(null);
  if (entryId && result === undefined)
    return (
      <ScreenFrame title="Edit entry" onBack={closeEntryEditor}>
        <Feedback loading message="Loading entry…" />
      </ScreenFrame>
    );
  if (entryId && result === null)
    return (
      <ScreenFrame title="Entry unavailable" onBack={closeEntryEditor}>
        <Feedback message="This entry is unavailable or in Trash." />
      </ScreenFrame>
    );
  return (
    <Editor
      key={`${entryId ?? 'new'}-${reload?.version ?? 0}`}
      initial={reload ? reload.entry : (result?.entry ?? null)}
      onReload={async (savedId) => {
        const id = savedId ?? entryId;
        if (!id) throw new Error('Reopen this draft from your entries.');
        const latest = await convex.query(api.entries.get, { entryId: id });
        if (!latest) throw new Error('Entry unavailable');
        setReload((previous) => ({
          version: (previous?.version ?? 0) + 1,
          entry: latest.entry,
        }));
      }}
    />
  );
}
export function EntryEditorScreen({ entryId }: { entryId?: Id<'entries'> }) {
  const { isAuthenticated } = useAuthSession();
  const { isPreview } = useNavigationPreview();
  return (
    <QueryBoundary title="Entry" onBack={closeEntryEditor}>
      {isAuthenticated && !isPreview ? (
        <PrivateEditor entryId={entryId} />
      ) : (
        <ScreenFrame title="Add Entry" onBack={closeEntryEditor}>
          <Feedback message="Sign in to write an entry. Design preview does not access private records." />
        </ScreenFrame>
      )}
    </QueryBoundary>
  );
}
