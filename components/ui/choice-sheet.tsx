import type { PropsWithChildren } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { layout } from '@/constants/design-tokens';
import { Button } from './button';
import { Typography } from './typography';

export function ChoiceSheet({
  title,
  onClose,
  children,
}: PropsWithChildren<{ title: string; onClose: () => void }>) {
  const reducedMotion = useReducedMotion();
  const insets = useSafeAreaInsets();
  return (
    <Modal
      transparent
      visible
      animationType={reducedMotion ? 'none' : 'slide'}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end">
        <Pressable
          accessible={false}
          className="absolute inset-0 bg-foreground/40"
          onPress={onClose}
        />
        <View
          accessibilityViewIsModal
          className="rounded-t-card bg-surface"
          style={{
            maxHeight: '90%',
            paddingLeft: insets.left,
            paddingRight: insets.right,
          }}
        >
          <View className="flex-row items-center gap-3 px-5 py-3">
            <Typography
              variant="title"
              accessibilityRole="header"
              className="flex-1"
            >
              {title}
            </Typography>
            <Button
              title="Close selection"
              icon="x"
              iconOnly
              variant="secondary"
              onPress={onClose}
            />
          </View>
          <ScrollView
            contentContainerClassName="gap-4 px-5 pt-3"
            contentContainerStyle={{
              paddingBottom: insets.bottom + layout.spacing[6],
            }}
          >
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
