import { Stack, useLocalSearchParams } from 'expo-router';
import type { Id } from '@/convex/_generated/dataModel';
import { EntryEditorScreen } from '@/components/journal/entry-editor-screen';

export default function EditEntryScreen() {
  const { entryId } = useLocalSearchParams<{ entryId: string }>();
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <EntryEditorScreen entryId={entryId as Id<'entries'>} />
    </>
  );
}
