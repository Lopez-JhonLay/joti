import { Stack } from 'expo-router';
import { useNavigationStyles } from '@/lib/theme';

export default function ProtectedLayout() {
  const styles = useNavigationStyles();
  return (
    <Stack screenOptions={styles}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="add-entry"
        options={{
          title: 'Add Entry',
          presentation: 'modal',
          headerShown: false,
        }}
      />
    </Stack>
  );
}
