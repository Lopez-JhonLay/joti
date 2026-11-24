import { router } from 'expo-router';
import { Button } from '@/components/ui/button';

import { PlaceholderScreen } from '@/components/ui/placeholder-screen';

export default function AddEntryScreen() {
  return (
    <PlaceholderScreen
      title="Add Entry"
      description="The guided journal form and saving will be implemented in Phase 3."
    >
      <Button
        title="Close"
        icon="x"
        variant="secondary"
        onPress={() => router.back()}
      />
    </PlaceholderScreen>
  );
}
