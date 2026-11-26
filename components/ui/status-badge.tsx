import { View } from 'react-native';
import { Typography } from './typography';

const tones = {
  neutral: { surface: 'border-border bg-elevated', text: 'text-muted' },
  success: { surface: 'border-success/20 bg-success/10', text: 'text-success' },
  warning: { surface: 'border-warning/20 bg-warning/10', text: 'text-warning' },
  danger: { surface: 'border-danger/20 bg-danger/10', text: 'text-danger' },
  info: { surface: 'border-primary/20 bg-primary/10', text: 'text-link' },
};
export function StatusBadge({
  label,
  accessibilityLabel = label,
  tone = 'neutral',
}: {
  label: string;
  accessibilityLabel?: string;
  tone?: keyof typeof tones;
}) {
  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel}
      accessibilityLiveRegion="polite"
      className={`self-end rounded-pill border px-2 py-1 ${tones[tone].surface}`}
    >
      <Typography variant="caption" className={tones[tone].text}>
        {label}
      </Typography>
    </View>
  );
}
