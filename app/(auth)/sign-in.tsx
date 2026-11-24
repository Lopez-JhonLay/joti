import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/button';
import { Card, ResponsivePair } from '@/components/ui/layout';
import { Typography } from '@/components/ui/typography';

import { PlaceholderScreen } from '@/components/ui/placeholder-screen';
import { useNavigationPreview } from '@/lib/navigation-preview';
import { useAuthSession } from '@/lib/auth-session';

export default function SignInScreen() {
  const { enterPreview } = useNavigationPreview();
  const { signIn, isSigningIn, unavailableReason, error } = useAuthSession();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <PlaceholderScreen
        patterned
        title="Joti"
        description="Little notes. Big progress. A quieter space to remember the work that matters."
      >
        <ResponsivePair>
          <Card className="md:flex-1">
            <Typography
              variant="caption"
              className="uppercase tracking-widest text-link"
            >
              Make room for progress
            </Typography>
            <Typography variant="heading">
              Your work deserves a place.
            </Typography>
            <Typography className="text-muted">
              Keep the small wins, thoughtful contributions, and moments of
              growth together.
            </Typography>
          </Card>
          <Card className="md:flex-1">
            <Typography variant="title">
              One place. Your perspective.
            </Typography>
            <Typography className="text-muted">
              Sign in with Google to keep your work journal private and return
              to your progress whenever you need it.
            </Typography>
            <Button
              title="Continue with Google"
              onPress={() => void signIn()}
              loading={isSigningIn}
              disabled={!!unavailableReason}
            />
            {unavailableReason && (
              <Typography variant="caption">{unavailableReason}</Typography>
            )}
            {error && (
              <Typography accessibilityRole="alert" className="text-danger">
                {error}
              </Typography>
            )}
            {__DEV__ && (
              <Button
                title="Preview navigation"
                icon="notebook-pen"
                variant="secondary"
                disabled={isSigningIn}
                onPress={enterPreview}
              />
            )}
          </Card>
        </ResponsivePair>
      </PlaceholderScreen>
    </View>
  );
}
