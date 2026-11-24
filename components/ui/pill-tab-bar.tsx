import { BottomTabBar } from 'expo-router/js-tabs';
import type {
  BottomTabBarButtonProps,
  BottomTabBarProps,
} from 'expo-router/js-tabs';
import { createContext, useContext, useEffect, useState } from 'react';
import { Animated, I18nManager, Pressable, View } from 'react-native';
import type { ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { layout } from '@/constants/design-tokens';
import { useTheme } from '@/lib/theme';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { AnimatedIcon } from '@/components/ui/animated-icon';
import type { AnimatedIconName } from '@/components/ui/animated-icon';

type TabMotion = {
  selectedName: string;
  count: number;
  width: number;
  position: Animated.Value;
};

const TabMotionContext = createContext<TabMotion | null>(null);

function useTabMotion() {
  const motion = useContext(TabMotionContext);
  if (!motion) throw new Error('Pill tab animations require PillTabBar');
  return motion;
}

export function PillTabBar(props: BottomTabBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const [width, setWidth] = useState(0);
  const index = I18nManager.isRTL
    ? props.state.routes.length - 1 - props.state.index
    : props.state.index;
  const [position] = useState(() => new Animated.Value(index));

  useEffect(() => {
    position.stopAnimation();
    if (reducedMotion) {
      position.setValue(index);
      return;
    }
    const animation = Animated.spring(position, {
      toValue: index,
      stiffness: 240,
      damping: 26,
      mass: 0.8,
      overshootClamping: true,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [index, position, reducedMotion]);

  return (
    <TabMotionContext.Provider
      value={{
        selectedName: props.state.routes[props.state.index].name,
        count: props.state.routes.length,
        width,
        position,
      }}
    >
      <View
        style={{
          backgroundColor: colors.background,
          paddingLeft: Math.max(insets.left, layout.spacing[4]),
          paddingRight: Math.max(insets.right, layout.spacing[4]),
          paddingBottom: Math.max(insets.bottom, layout.spacing[3]),
          paddingTop: layout.spacing[2],
        }}
      >
        <View
          testID="pill-tab-surface"
          onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
          style={{
            borderRadius: layout.radius.pill,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
          }}
        >
          <BottomTabBar {...props} />
        </View>
      </View>
    </TabMotionContext.Provider>
  );
}

export function PillTabIndicator() {
  const { colors } = useTheme();
  const { width, count, position } = useTabMotion();
  const padding = layout.spacing[2];
  const itemMargin = layout.spacing[1] / 2;
  // Surface width includes its 1-point border on each side; the bar's four
  // equally sized flex items occupy the space inside its horizontal padding.
  const slotWidth = Math.max(0, (width - 2 - padding * 2) / count);
  if (!slotWidth) return null;

  return (
    <Animated.View
      testID="pill-tab-indicator"
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        position: 'absolute',
        left: padding + itemMargin,
        top: padding,
        width: Math.max(0, slotWidth - itemMargin * 2),
        height: layout.touchTarget + layout.spacing[2],
        borderRadius: layout.radius.pill,
        backgroundColor: colors.elevated,
        transform: [{ translateX: Animated.multiply(position, slotWidth) }],
      }}
    />
  );
}

export function PillTabIcon({
  routeName,
  name,
  color,
  size,
}: {
  routeName: string;
  name: AnimatedIconName;
  color?: ColorValue | null;
  size: number;
}) {
  const { selectedName } = useTabMotion();
  // The navigator renders permanent focused=true/false icon copies. Actual
  // selection, rather than that fixed argument, must drive animation replay.
  return (
    <AnimatedIcon
      name={name}
      color={color}
      size={size}
      active={selectedName === routeName}
    />
  );
}

export function PillTabButton(props: BottomTabBarButtonProps) {
  return (
    <Pressable
      accessible
      role={props.role}
      aria-label={props['aria-label']}
      aria-selected={props['aria-selected']}
      accessibilityRole={props.accessibilityRole}
      accessibilityLabel={props.accessibilityLabel}
      accessibilityState={props.accessibilityState}
      testID={props.testID}
      disabled={props.disabled}
      onPress={props.onPress}
      onLongPress={props.onLongPress}
      onPressIn={props.onPressIn}
      onPressOut={props.onPressOut}
      onFocus={props.onFocus}
      onBlur={props.onBlur}
      style={[
        props.style,
        // The default tab button paints its own square background. Override it
        // here, after its style, and clip feedback at the same rounded boundary.
        {
          borderRadius: layout.radius.pill,
          overflow: 'hidden',
          minHeight: layout.touchTarget,
        },
      ]}
    >
      {props.children}
    </Pressable>
  );
}
