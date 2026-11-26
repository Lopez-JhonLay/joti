import { Stack, useLocalSearchParams } from 'expo-router';
import type { Id } from '@/convex/_generated/dataModel';
import { EntryDetailScreen } from '@/components/journal/entry-detail-screen';

export default function EntryDetailRoute() {
  const { entryId, completed } = useLocalSearchParams<{
    entryId: string;
    completed?: string;
  }>();
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <EntryDetailScreen
        entryId={entryId as Id<'entries'>}
        completed={completed === '1'}
      />
    </>
  );
}
