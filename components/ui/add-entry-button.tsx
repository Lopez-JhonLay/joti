import { router } from 'expo-router';
import { Button } from 'react-native';

export function AddEntryButton() {
  return <Button title="Add Entry" onPress={() => router.push('/add-entry')} />;
}
