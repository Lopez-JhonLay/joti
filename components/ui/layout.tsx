import { View } from 'react-native';
import type { ViewProps } from 'react-native';
import { layout } from '@/constants/design-tokens';

export const ROW_INSET_STYLE = {
  paddingHorizontal: layout.spacing[4],
} as const;

export function Container({ className = '', ...props }: ViewProps) {
  return <View className={`screen-container ${className}`} {...props} />;
}

export function Card({ className = '', ...props }: ViewProps) {
  return <View className={`surface-card gap-4 ${className}`} {...props} />;
}

export function ActionRow({ className = '', ...props }: ViewProps) {
  return <View className={`action-row ${className}`} {...props} />;
}

export function ResponsivePair({ className = '', ...props }: ViewProps) {
  return <View className={`responsive-pair ${className}`} {...props} />;
}

export function Divider({ className = '', ...props }: ViewProps) {
  return <View className={`divider ${className}`} {...props} />;
}
