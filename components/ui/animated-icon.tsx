import { useEffect, useMemo, useState } from 'react';
import { Animated, Easing } from 'react-native';
import type { ColorValue } from 'react-native';
import Building2 from 'lucide-react-native/icons/building-2';
import History from 'lucide-react-native/icons/history';
import House from 'lucide-react-native/icons/house';
import LogOut from 'lucide-react-native/icons/log-out';
import Monitor from 'lucide-react-native/icons/monitor';
import Moon from 'lucide-react-native/icons/moon';
import NotebookPen from 'lucide-react-native/icons/notebook-pen';
import Plus from 'lucide-react-native/icons/plus';
import Settings from 'lucide-react-native/icons/settings';
import Sun from 'lucide-react-native/icons/sun';
import X from 'lucide-react-native/icons/x';

import { useTheme } from '@/lib/theme';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

const icons = {
  house: House,
  history: History,
  'building-2': Building2,
  settings: Settings,
  plus: Plus,
  monitor: Monitor,
  sun: Sun,
  moon: Moon,
  'log-out': LogOut,
  'notebook-pen': NotebookPen,
  x: X,
};

export type AnimatedIconName = keyof typeof icons;

type AnimatedIconProps = {
  name: AnimatedIconName;
  size?: number;
  color?: ColorValue | null;
  active?: boolean;
};

// Native adaptation of Lucide Animated's interaction-led motion language.
// The upstream DOM/Motion components cannot run in Expo Go.
export function AnimatedIcon({
  name,
  size = 22,
  color,
  active = false,
}: AnimatedIconProps) {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const [progress] = useState(() => new Animated.Value(0));
  const Icon = icons[name];

  useEffect(() => {
    progress.stopAnimation();
    if (reducedMotion) {
      progress.setValue(0);
      return;
    }
    // Each real focus/press activation replays from the start, including quick
    // switches back to a tab whose previous animation was interrupted.
    if (active) progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: active ? 1 : 0,
      duration: active ? 420 : 160,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [active, name, progress, reducedMotion]);

  const animatedStyle = useMemo(() => {
    const peak =
      name === 'settings' || name === 'plus'
        ? 180
        : name === 'history'
          ? -360
          : name === 'sun'
            ? 45
            : 0;
    const pulseRotation = name === 'moon' || name === 'x';
    return {
      transform: [
        {
          rotate: progress.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [
              '0deg',
              `${pulseRotation ? -12 : peak / 2}deg`,
              `${peak}deg`,
            ],
          }),
        },
        {
          translateY: progress.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [
              0,
              name === 'house' || name === 'building-2' ? -3 : 0,
              0,
            ],
          }),
        },
        {
          translateX: progress.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0, name === 'log-out' ? 3 : 0, 0],
          }),
        },
        {
          scale: progress.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [
              1,
              name === 'monitor' || name === 'notebook-pen' ? 1.08 : 1,
              1,
            ],
          }),
        },
      ],
    };
  }, [name, progress]);

  return (
    <Animated.View
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ width: size, height: size }, animatedStyle]}
    >
      <Icon
        size={size}
        color={color ?? colors.foreground}
        strokeWidth={2}
        accessible={false}
      />
    </Animated.View>
  );
}
