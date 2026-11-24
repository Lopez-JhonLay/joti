import { Button } from '@/components/ui/button';
import { ConvexStatus } from '@/components/ui/convex-status';
import { ThemePicker } from '@/components/ui/theme-picker';

import { PlaceholderScreen } from '@/components/ui/placeholder-screen';
import { useNavigationPreview } from '@/lib/navigation-preview';
import { useAuthSession } from '@/lib/auth-session';
import { Typography } from '@/components/ui/typography';

export default function SettingsScreen() {
  const { exitPreview, isPreview } = useNavigationPreview();
  const { isAuthenticated, signOut, isSigningOut, error } = useAuthSession();

  return (
    <PlaceholderScreen
      title="Settings"
      description={
        isAuthenticated
          ? 'Your journal is private to your Google account. Manage your session and preferences here.'
          : 'Design preview only. No account is signed in and no private journal data is available.'
      }
    >
      <ThemePicker />
      {__DEV__ && <ConvexStatus />}
      {isAuthenticated && (
        <Button
          title="Sign out"
          icon="log-out"
          variant="secondary"
          loading={isSigningOut}
          onPress={() => {
            exitPreview();
            void signOut();
          }}
        />
      )}
      {error && (
        <Typography accessibilityRole="alert" className="text-danger">
          {error}
        </Typography>
      )}
      {__DEV__ && isPreview && (
        <Button
          title="Exit preview"
          icon="log-out"
          variant="secondary"
          onPress={exitPreview}
        />
      )}
    </PlaceholderScreen>
  );
}
