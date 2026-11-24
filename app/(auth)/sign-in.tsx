import { Button } from 'react-native';

import { PlaceholderScreen } from '@/components/ui/placeholder-screen';
import { useNavigationPreview } from '@/lib/navigation-preview';

export default function SignInScreen() {
  const { enterPreview } = useNavigationPreview();

  return (
    <PlaceholderScreen
      title="Joti"
      description="Little notes. Big progress. Google sign-in will be connected in Phase 1.5."
    >
      {__DEV__ && <Button title="Preview navigation" onPress={enterPreview} />}
    </PlaceholderScreen>
  );
}
