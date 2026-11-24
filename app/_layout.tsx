import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import {
  NavigationPreviewProvider,
  useNavigationPreview,
} from '@/lib/navigation-preview';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = { initialRouteName: '(auth)' };

function RootNavigator() {
  const { isLoading, isPreview } = useNavigationPreview();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator accessibilityLabel="Loading Joti" size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ animation: 'slide_from_right' }}>
      <Stack.Protected guard={!isPreview} redirectTo="/">
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={isPreview} redirectTo="/sign-in">
        <Stack.Screen name="(protected)" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <NavigationPreviewProvider>
        <StatusBar style="dark" />
        <RootNavigator />
      </NavigationPreviewProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
