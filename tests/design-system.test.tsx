import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Appearance, Dimensions, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Container, ResponsivePair } from '@/components/ui/layout';
import { ThemePicker } from '@/components/ui/theme-picker';
import { Typography } from '@/components/ui/typography';
import { palettes } from '@/constants/design-tokens';
import { ThemeProvider } from '@/lib/theme';

function rgba(hex: string) {
  return `rgba(${[1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16)).join(', ')}, 1)`;
}

it('changes semantic native styles between light, dark, and system preferences', async () => {
  await render(
    <ThemeProvider>
      <View testID="surface" className="bg-background">
        <Typography testID="copy">Readable journal text</Typography>
        <Button title="Continue" />
        <ThemePicker />
      </View>
    </ThemeProvider>,
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Dark' }));
  expect(screen.getByTestId('surface')).toHaveStyle({
    backgroundColor: rgba(palettes.dark.background),
  });
  expect(screen.getByTestId('copy')).toHaveStyle({
    color: rgba(palettes.dark.foreground),
    fontSize: 16,
  });
  expect(screen.getByText('Continue')).toHaveStyle({
    color: rgba(palettes.dark['on-primary']),
  });
  await fireEvent.press(screen.getByRole('button', { name: 'Light' }));
  expect(screen.getByTestId('surface')).toHaveStyle({
    backgroundColor: rgba(palettes.light.background),
  });
  expect(screen.getByText('Continue')).toHaveStyle({
    color: rgba(palettes.light['on-primary']),
  });
  await fireEvent.press(screen.getByRole('button', { name: 'System' }));
  const system = Appearance.getColorScheme() ?? 'light';
  expect(screen.getByTestId('surface')).toHaveStyle({
    backgroundColor: rgba(palettes[system].background),
  });
});

it('prevents disabled and busy actions while retaining accessible labels', async () => {
  const onPress = jest.fn();
  await render(
    <ThemeProvider>
      <Button title="Save entry" disabled onPress={onPress} />
      <Button title="Upload evidence" loading onPress={onPress} />
    </ThemeProvider>,
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Save entry' }));
  await fireEvent.press(
    screen.getByRole('button', { name: 'Upload evidence' }),
  );
  expect(onPress).not.toHaveBeenCalled();
  expect(
    screen.getByRole('button', { name: 'Upload evidence' }),
  ).toBeDisabled();
  expect(
    screen.getByRole('button', { name: 'Upload evidence', busy: true }),
  ).toBeVisible();
});

it.each([320, 390, 768, 1024])(
  'adapts containers and stacked content at a %s-point viewport',
  async (width) => {
    const previous = Dimensions.get('window');
    await act(async () => {
      Dimensions.set({ window: { ...previous, width } });
    });
    try {
      await render(
        <ThemeProvider>
          <Container testID="container">
            <ResponsivePair testID="pair">
              <Typography>First</Typography>
              <Typography>Second</Typography>
            </ResponsivePair>
          </Container>
        </ThemeProvider>,
      );
      expect(screen.getByTestId('container')).toHaveStyle({
        maxWidth: 960,
        paddingLeft: width >= 768 ? 32 : width >= 480 ? 24 : 20,
      });
      expect(screen.getByTestId('pair')).toHaveStyle({
        flexDirection: width >= 768 ? 'row' : 'column',
      });
    } finally {
      await act(async () => {
        Dimensions.set({ window: previous });
      });
    }
  },
);

function luminance(hex: string) {
  const channels = [1, 3, 5].map((start) => {
    const value = parseInt(hex.slice(start, start + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

it.each(['light', 'dark'] as const)(
  'keeps %s text and control contrast readable',
  (scheme) => {
    const colors = palettes[scheme];
    for (const [text, backgrounds] of [
      [colors.foreground, [colors.background, colors.surface]],
      [colors.muted, [colors.background, colors.surface]],
      [colors.link, [colors.background, colors.surface]],
      [colors['on-primary'], [colors.primary, colors['primary-pressed']]],
    ] as const) {
      for (const background of backgrounds) {
        const values = [luminance(text), luminance(background)].sort(
          (a, b) => b - a,
        );
        expect((values[0] + 0.05) / (values[1] + 0.05)).toBeGreaterThanOrEqual(
          4.5,
        );
      }
    }
  },
);
