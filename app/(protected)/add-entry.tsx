import { router } from 'expo-router';
import { Button } from 'react-native';

import { PlaceholderScreen } from '@/components/ui/placeholder-screen';

export default function AddEntryScreen() {
  return (
    <PlaceholderScreen
      title="Add Entry"
      description="The guided journal form and saving will be implemented in Phase 3."
    >
      <Button title="Close" onPress={() => router.back()} />
    </PlaceholderScreen>
  );
}
