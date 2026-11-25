import type { PropsWithChildren, ReactNode } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedIcon } from '@/components/ui/animated-icon';
import { Typography } from '@/components/ui/typography';
import { layout } from '@/constants/design-tokens';

type ScreenFrameProps = PropsWithChildren<{
  title: string;
  onBack?: () => void;
  actions?: ReactNode;
}>;

export function ScreenFrame({
  title,
  onBack,
  actions,
  children,
}: ScreenFrameProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      className="flex-1 bg-background"
      style={{
        paddingTop: insets.top,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}
    >
      <View
        className="mx-auto w-full max-w-reading flex-row items-center gap-3 px-5 sm:px-6"
        style={{ minHeight: layout.touchTarget + layout.spacing[2] }}
      >
        {onBack && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={onBack}
            className="min-h-touch items-center justify-center rounded-control active:bg-elevated"
            style={{ minWidth: layout.touchTarget }}
          >
            {({ pressed }) => (
              <AnimatedIcon name="arrow-left" active={pressed} />
            )}
          </Pressable>
        )}
        <Typography
          accessibilityRole="header"
          variant="heading"
          className="flex-1 py-2"
        >
          {title}
        </Typography>
        {actions && (
          <View className="shrink-0 flex-row items-center gap-2">
            {actions}
          </View>
        )}
      </View>
      <ScrollView
        className="flex-1"
        contentContainerClassName="grow"
        contentContainerStyle={{ paddingBottom: insets.bottom }}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <View className="mx-auto w-full max-w-reading flex-1 gap-6 px-5 pb-6 pt-6 sm:px-6">
          {children}
        </View>
      </ScrollView>
    </View>
  );
}
