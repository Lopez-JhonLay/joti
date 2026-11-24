import '@/global.css';

import { Stack } from 'expo-router';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import {
  NavigationPreviewProvider,
  useNavigationPreview,
} from '@/lib/navigation-preview';
import { ThemeProvider, useTheme, useNavigationStyles } from '@/lib/theme';
import { BackendProvider } from '@/lib/convex-provider';
import { AuthSessionProvider, useAuthSession } from '@/lib/auth-session';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = { initialRouteName: '(auth)' };

function RootNavigator() {
  const { isPreview } = useNavigationPreview();
  const { isLoading, isAuthenticated } = useAuthSession();
  const hasAccess = isAuthenticated || isPreview;
  const { scheme, colors } = useTheme();
  const navigationStyles = useNavigationStyles();
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (fontError) throw fontError;

  if (isLoading || !fontsLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator
          accessibilityLabel="Loading Joti"
          size="large"
          color={colors.primary}
        />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{ ...navigationStyles, animation: 'slide_from_right' }}
      >
        <Stack.Protected guard={!hasAccess} redirectTo="/">
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Protected guard={hasAccess} redirectTo="/sign-in">
          <Stack.Screen name="(protected)" options={{ headerShown: false }} />
        </Stack.Protected>
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <BackendProvider>
          <AuthSessionProvider>
            <NavigationPreviewProvider>
              <RootNavigator />
            </NavigationPreviewProvider>
          </AuthSessionProvider>
        </BackendProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
