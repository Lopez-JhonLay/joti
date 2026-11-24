import { useId } from 'react';
import { View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Mask,
  Pattern,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

import { layout } from '@/constants/design-tokens';
import { useTheme } from '@/lib/theme';

// One tiled SVG keeps the native view count fixed as the section grows.
export function DotPattern() {
  const { colors } = useTheme();
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const patternId = `dots-${id}`;
  const fadeId = `fade-${id}`;
  const maskId = `mask-${id}`;
  const { spacing, radius } = layout.dotGrid;

  return (
    <View
      className="pattern-overlay"
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Svg width="100%" height="100%" accessible={false}>
        <Defs>
          <Pattern
            id={patternId}
            width={spacing}
            height={spacing}
            patternUnits="userSpaceOnUse"
          >
            <Circle
              cx={spacing / 2}
              cy={spacing / 2}
              r={radius}
              fill={colors.pattern}
            />
          </Pattern>
          <RadialGradient id={fadeId} cx="85%" cy="15%" rx="90%" ry="100%">
            <Stop offset="0" stopColor="white" stopOpacity={0.65} />
            <Stop offset="1" stopColor="white" stopOpacity={0} />
          </RadialGradient>
          <Mask
            id={maskId}
            x="0"
            y="0"
            width="100%"
            height="100%"
            maskUnits="userSpaceOnUse"
          >
            <Rect width="100%" height="100%" fill={`url(#${fadeId})`} />
          </Mask>
        </Defs>
        <Rect
          width="100%"
          height="100%"
          fill={`url(#${patternId})`}
          mask={`url(#${maskId})`}
        />
      </Svg>
    </View>
  );
}
