import { Button } from '@/components/ui/button';
import { ThemePicker } from '@/components/ui/theme-picker';

import { PlaceholderScreen } from '@/components/ui/placeholder-screen';
import { useNavigationPreview } from '@/lib/navigation-preview';

export default function SettingsScreen() {
  const { exitPreview } = useNavigationPreview();

  return (
    <PlaceholderScreen
      title="Settings"
      description="Account, export, Trash, and preferences will be added in later phases. No account is signed in."
    >
      <ThemePicker />
      {__DEV__ && (
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
