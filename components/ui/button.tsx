import { ActivityIndicator, Pressable } from 'react-native';
import type { PressableProps } from 'react-native';

import { Typography } from '@/components/ui/typography';
import { useTheme } from '@/lib/theme';
import { AnimatedIcon } from '@/components/ui/animated-icon';
import type { AnimatedIconName } from '@/components/ui/animated-icon';

const variants = {
  primary: { control: 'control-primary', label: 'text-on-primary' },
  secondary: { control: 'control-secondary', label: 'text-foreground' },
  ghost: { control: 'control-ghost', label: 'text-link' },
};

type ButtonProps = Omit<PressableProps, 'children'> & {
  title: string;
  variant?: keyof typeof variants;
  loading?: boolean;
  icon?: AnimatedIconName;
};

export function Button({
  title,
  variant = 'primary',
  loading = false,
  disabled,
  icon,
  className = '',
  ...props
}: ButtonProps) {
  const { colors } = useTheme();
  const blocked = disabled || loading;
  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityLabel={props.accessibilityLabel ?? title}
      accessibilityState={{
        ...props.accessibilityState,
        disabled: !!blocked,
        busy: loading,
      }}
      disabled={blocked}
      className={`control-base ${variants[variant].control} gap-2 focus:border-focus ${blocked ? 'opacity-50' : ''} ${className}`}
    >
      {({ pressed }) => (
        <>
          {loading ? (
            <ActivityIndicator
              color={variant === 'primary' ? colors['on-primary'] : colors.link}
            />
          ) : icon ? (
            <AnimatedIcon
              name={icon}
              size={18}
              color={
                variant === 'primary'
                  ? colors['on-primary']
                  : variant === 'ghost'
                    ? colors.link
                    : colors.foreground
              }
              active={!blocked && pressed}
            />
          ) : null}
          <Typography
            variant="label"
            className={`shrink ${variants[variant].label}`}
          >
            {title}
          </Typography>
        </>
      )}
    </Pressable>
  );
}
