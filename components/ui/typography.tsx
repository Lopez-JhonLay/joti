import { Text } from 'react-native';
import type { TextProps } from 'react-native';

const variants = {
  display: 'font-bold text-heading sm:text-display text-foreground',
  heading: 'font-bold text-title sm:text-heading text-foreground',
  title: 'font-semibold text-title text-foreground',
  body: 'font-sans text-body text-foreground',
  lead: 'font-sans text-lead text-muted',
  label: 'font-semibold text-label text-foreground',
  caption: 'font-medium text-caption text-muted',
};

type TypographyProps = TextProps & { variant?: keyof typeof variants };

export function Typography({
  variant = 'body',
  className = '',
  ...props
}: TypographyProps) {
  return <Text className={`${variants[variant]} ${className}`} {...props} />;
}
