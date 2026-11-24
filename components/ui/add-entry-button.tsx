import { router } from 'expo-router';
import { Button } from '@/components/ui/button';

export function AddEntryButton() {
  return (
    <Button
      title="Add Entry"
      icon="plus"
      className="mx-2"
      onPress={() => router.push('/add-entry')}
    />
  );
}
