import { useEffect, useState } from 'react';
import { ActivityIndicator, Animated } from 'react-native';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useTheme } from '@/lib/theme';
import { Typography } from '@/components/ui/typography';

export function Feedback({
  message,
  error = false,
  loading = false,
}: {
  message: string;
  error?: boolean;
  loading?: boolean;
}) {
  const reducedMotion = useReducedMotion();
  const { colors } = useTheme();
  const [opacity] = useState(() => new Animated.Value(1));
  useEffect(() => {
    opacity.stopAnimation();
    if (reducedMotion) {
      opacity.setValue(1);
      return;
    }
    opacity.setValue(0);
    const animation = Animated.timing(opacity, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [message, opacity, reducedMotion]);
  return (
    <Animated.View className="gap-3" style={{ opacity }}>
      {loading && (
        <ActivityIndicator
          color={colors.primary}
          accessibilityLabel={message}
        />
      )}
      <Typography
        accessibilityRole={error ? 'alert' : undefined}
        accessibilityLiveRegion="polite"
        className={error ? 'text-danger' : 'text-muted'}
      >
        {message}
      </Typography>
    </Animated.View>
  );
}
