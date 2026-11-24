import { Button } from 'react-native';

import { PlaceholderScreen } from '@/components/ui/placeholder-screen';
import { useNavigationPreview } from '@/lib/navigation-preview';

export default function SettingsScreen() {
  const { exitPreview } = useNavigationPreview();

  return (
    <PlaceholderScreen
      title="Settings"
      description="Account, export, Trash, and preferences will be added in later phases. No account is signed in."
    >
      {__DEV__ && <Button title="Exit preview" onPress={exitPreview} />}
    </PlaceholderScreen>
  );
}
