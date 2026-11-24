import type { PropsWithChildren } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Container, Divider } from '@/components/ui/layout';
import { Typography } from '@/components/ui/typography';
import { DotPattern } from '@/components/ui/dot-pattern';

type PlaceholderScreenProps = PropsWithChildren<{
  title: string;
  description: string;
  patterned?: boolean;
}>;

export function PlaceholderScreen({
  title,
  description,
  children,
  patterned = false,
}: PlaceholderScreenProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      className="flex-1 bg-background"
      style={{ paddingLeft: insets.left, paddingRight: insets.right }}
    >
      <ScrollView
        contentContainerClassName="grow"
        contentContainerStyle={{ paddingBottom: insets.bottom }}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <Container className="gap-8">
          <View className={patterned ? 'pattern-section' : ''}>
            {patterned && <DotPattern />}
            <View
              className={`reading-container gap-4 ${patterned ? 'p-6 sm:p-8' : ''}`}
            >
              <Typography
                variant="caption"
                className="uppercase tracking-widest text-link"
              >
                Joti / Work journal
              </Typography>
              <Typography accessibilityRole="header" variant="display">
                {title}
              </Typography>
              <Typography variant="lead">{description}</Typography>
            </View>
          </View>
          <Divider />
          <View className="gap-6">{children}</View>
        </Container>
      </ScrollView>
    </View>
  );
}
