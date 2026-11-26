import { Stack } from 'expo-router';
import { EntriesScreen } from '@/components/journal/entries-screen';
export default function EntriesRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <EntriesScreen />
    </>
  );
}
