import { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator } from 'react-native';
import { PlaceholderScreen } from '@/components/ui/placeholder-screen';
import { Button } from '@/components/ui/button';
import { Typography } from '@/components/ui/typography';
import { useAuthSession } from '@/lib/auth-session';
import { GOOGLE_RETURN_URL } from '@/lib/google-auth-flow';
import { useTheme } from '@/lib/theme';

export default function AuthCallbackScreen() {
  const { convexAuthCode, convexAuthError } = useLocalSearchParams<{
    convexAuthCode?: string;
    convexAuthError?: string;
  }>();
  const { finishSignIn, error } = useAuthSession();
  const { colors } = useTheme();
  const router = useRouter();
  const started = useRef(false);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const url = new URL(GOOGLE_RETURN_URL);
    if (typeof convexAuthCode === 'string')
      url.searchParams.set('convexAuthCode', convexAuthCode);
    if (typeof convexAuthError === 'string')
      url.searchParams.set('convexAuthError', convexAuthError);
    void finishSignIn(url.toString()).finally(() => setFinished(true));
  }, [convexAuthCode, convexAuthError, finishSignIn]);

  return (
    <PlaceholderScreen
      title="Signing in"
      description="Finishing your secure Google sign-in."
    >
      {!finished && !error && (
        <ActivityIndicator
          accessibilityLabel="Finishing sign-in"
          color={colors.primary}
        />
      )}
      {error && (
        <Typography accessibilityRole="alert" className="text-danger">
          {error}
        </Typography>
      )}
      {(finished || error) && (
        <Button
          title="Back to sign in"
          onPress={() => router.replace('/sign-in')}
        />
      )}
    </PlaceholderScreen>
  );
}
