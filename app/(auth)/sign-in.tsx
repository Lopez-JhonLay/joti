import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/button';
import { Card, ResponsivePair } from '@/components/ui/layout';
import { Typography } from '@/components/ui/typography';

import { PlaceholderScreen } from '@/components/ui/placeholder-screen';
import { useNavigationPreview } from '@/lib/navigation-preview';

export default function SignInScreen() {
  const { enterPreview } = useNavigationPreview();
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
              Google sign-in will be connected in Phase 1.5. For now, explore
              the journal shell.
            </Typography>
            {__DEV__ && (
              <Button
                title="Preview navigation"
                icon="notebook-pen"
                onPress={enterPreview}
              />
            )}
          </Card>
        </ResponsivePair>
      </PlaceholderScreen>
    </View>
  );
}
