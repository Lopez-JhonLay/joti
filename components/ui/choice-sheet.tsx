import { useEffect, useState, type PropsWithChildren } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { layout } from '@/constants/design-tokens';
import { useTheme } from '@/lib/theme';
import { Button } from './button';
import { Typography } from './typography';

export function ChoiceSheet({
  title,
  onClose,
  children,
}: PropsWithChildren<{ title: string; onClose: () => void }>) {
  const reducedMotion = useReducedMotion();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const { colors, scheme } = useTheme();
  const [shown, setShown] = useState(false);
  const [sheetHeight, setSheetHeight] = useState(windowHeight);
  const [backdrop] = useState(() => new Animated.Value(0));
  const [entrance] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (!shown) return;
    backdrop.stopAnimation();
    entrance.stopAnimation();
    if (reducedMotion) {
      backdrop.setValue(1);
      entrance.setValue(1);
      return;
    }
    const animation = Animated.parallel([
      Animated.timing(backdrop, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(entrance, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [shown, reducedMotion, backdrop, entrance]);
  return (
    <Modal
      testID="choice-sheet"
      transparent
      visible
      animationType="none"
      onShow={() => setShown(true)}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end">
        <Animated.View
          className="absolute inset-0"
          style={{
            opacity: backdrop.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.45],
            }),
            backgroundColor:
              scheme === 'dark' ? colors.background : colors.foreground,
          }}
        >
          <Pressable
            accessible={false}
            className="absolute inset-0"
            onPress={onClose}
          />
        </Animated.View>
        <Animated.View
          accessibilityViewIsModal
          className="rounded-t-card bg-surface"
          onLayout={(event) => setSheetHeight(event.nativeEvent.layout.height)}
          style={{
            minHeight: windowHeight * 0.5,
            maxHeight: '90%',
            paddingLeft: insets.left,
            paddingRight: insets.right,
            transform: [
              {
                translateY: entrance.interpolate({
                  inputRange: [0, 1],
                  outputRange: [sheetHeight, 0],
                }),
              },
            ],
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
              paddingHorizontal: layout.spacing[5],
              paddingBottom: insets.bottom + layout.spacing[6],
            }}
          >
            {children}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
