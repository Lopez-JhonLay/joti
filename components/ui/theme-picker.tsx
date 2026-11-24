import { Button } from '@/components/ui/button';
import { Card, ActionRow } from '@/components/ui/layout';
import { Typography } from '@/components/ui/typography';
import { useTheme } from '@/lib/theme';
import type { ThemePreference } from '@/lib/theme';
import type { AnimatedIconName } from '@/components/ui/animated-icon';

const preferences: ThemePreference[] = ['system', 'light', 'dark'];
const preferenceIcons: Record<ThemePreference, AnimatedIconName> = {
  system: 'monitor',
  light: 'sun',
  dark: 'moon',
};

export function ThemePicker() {
  const { preference, setPreference } = useTheme();
  return (
    <Card>
      <Typography variant="label">Appearance</Typography>
      <Typography className="text-muted">
        Follow your phone or choose a theme for this session.
      </Typography>
      <ActionRow>
        {preferences.map((value) => (
          <Button
            key={value}
            icon={preferenceIcons[value]}
            title={value[0].toUpperCase() + value.slice(1)}
            variant={preference === value ? 'primary' : 'secondary'}
            accessibilityState={{ selected: preference === value }}
            onPress={() => setPreference(value)}
          />
        ))}
      </ActionRow>
    </Card>
  );
}
