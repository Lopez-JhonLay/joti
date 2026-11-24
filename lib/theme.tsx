import { createContext, useContext, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { useColorScheme, View } from 'react-native';
import { vars } from 'nativewind';
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from 'expo-router';

import { fonts, palettes, toVariables } from '@/constants/design-tokens';

export type ThemePreference = 'system' | 'light' | 'dark';

type ThemeContextValue = {
  scheme: 'light' | 'dark';
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  colors: typeof palettes.light;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme();
  const [preference, setPreference] = useState<ThemePreference>('system');
  const scheme =
    preference === 'system' ? (systemScheme ?? 'light') : preference;
  const colors = palettes[scheme];
  const baseTheme = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...baseTheme,
    colors: {
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.foreground,
      border: colors.border,
      notification: colors.danger,
    },
  };

  return (
    <ThemeContext.Provider
      value={{ scheme, preference, setPreference, colors }}
    >
      <View style={vars(toVariables(colors))} className="flex-1 bg-background">
        <NavigationThemeProvider value={navigationTheme}>
          {children}
        </NavigationThemeProvider>
      </View>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error('useTheme requires ThemeProvider');
  return theme;
}

// Native headers cannot consume className; use the same semantic palette.
export function useNavigationStyles() {
  const { colors } = useTheme();
  return {
    headerStyle: { backgroundColor: colors.background },
    headerTintColor: colors.foreground,
    headerTitleStyle: { fontFamily: fonts.semibold },
    headerShadowVisible: false,
    contentStyle: { backgroundColor: colors.background },
  };
}
