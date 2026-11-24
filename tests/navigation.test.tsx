import {
  fireEvent,
  renderRouter,
  screen,
  testRouter,
  waitFor,
} from 'expo-router/testing-library';
import { AccessibilityInfo, Animated } from 'react-native';

import RootLayout from '@/app/_layout';
import AuthLayout from '@/app/(auth)/_layout';
import SignInScreen from '@/app/(auth)/sign-in';
import ProtectedLayout from '@/app/(protected)/_layout';
import TabsLayout from '@/app/(protected)/(tabs)/_layout';
import HomeScreen from '@/app/(protected)/(tabs)/index';
import HistoryScreen from '@/app/(protected)/(tabs)/history';
import CompaniesScreen from '@/app/(protected)/(tabs)/companies';
import SettingsScreen from '@/app/(protected)/(tabs)/settings';
import AddEntryScreen from '@/app/(protected)/add-entry';
import { layout } from '@/constants/design-tokens';

const routes = {
  _layout: RootLayout,
  '(auth)/_layout': AuthLayout,
  '(auth)/sign-in': SignInScreen,
  '(protected)/_layout': ProtectedLayout,
  '(protected)/(tabs)/_layout': TabsLayout,
  '(protected)/(tabs)/index': HomeScreen,
  '(protected)/(tabs)/history': HistoryScreen,
  '(protected)/(tabs)/companies': CompaniesScreen,
  '(protected)/(tabs)/settings': SettingsScreen,
  '(protected)/add-entry': AddEntryScreen,
};

afterEach(() => jest.restoreAllMocks());

it.each(['/', '/history', '/companies', '/settings', '/add-entry'])(
  'redirects a protected deep link (%s) to the auth placeholder',
  async (initialUrl) => {
    await renderRouter(routes, { initialUrl });
    await waitFor(() => expect(screen).toHavePathname('/sign-in'));
    expect(
      screen.getByRole('button', { name: 'Preview navigation' }),
    ).toBeVisible();
  },
);

it('navigates the preview tabs, opens and closes Add Entry, then revokes access', async () => {
  jest
    .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
    .mockResolvedValue(false);
  const iconTiming = jest.spyOn(Animated, 'timing');
  const highlightSpring = jest.spyOn(Animated, 'spring');
  await renderRouter(routes, { initialUrl: '/sign-in' });
  await fireEvent.press(
    screen.getByRole('button', { name: 'Preview navigation' }),
  );
  expect(screen).toHavePathname('/');

  await fireEvent(screen.getByTestId('pill-tab-surface'), 'layout', {
    nativeEvent: { layout: { width: 360, height: 74, x: 0, y: 0 } },
  });
  expect(
    screen.getByTestId('pill-tab-indicator', { includeHiddenElements: true }),
  ).toHaveStyle({ borderRadius: layout.radius.pill });

  expect(screen.getByTestId('pill-tab-surface')).toHaveStyle({
    borderRadius: layout.radius.pill,
    overflow: 'hidden',
  });
  expect(screen.getByRole('button', { name: /^Home, tab/ })).toHaveStyle({
    borderRadius: layout.radius.pill,
    overflow: 'hidden',
  });

  for (const name of ['History', 'Companies', 'Settings', 'Home']) {
    iconTiming.mockClear();
    highlightSpring.mockClear();
    await fireEvent.press(
      screen.getByRole('button', { name: new RegExp(`^${name}, tab`) }),
    );
    expect(screen.getByRole('header', { name })).toBeVisible();
    await waitFor(() =>
      expect(iconTiming).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          toValue: 1,
          duration: 420,
          useNativeDriver: true,
        }),
      ),
    );
    expect(highlightSpring).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        toValue: ['Home', 'History', 'Companies', 'Settings'].indexOf(name),
        useNativeDriver: true,
      }),
    );
  }

  await fireEvent.press(
    screen.getAllByRole('button', { name: 'Add Entry' })[0],
  );
  expect(screen).toHavePathname('/add-entry');
  await fireEvent.press(screen.getByRole('button', { name: 'Close' }));
  expect(screen).toHavePathname('/');

  await fireEvent.press(screen.getByRole('button', { name: /^Settings, tab/ }));
  await fireEvent.press(screen.getByRole('button', { name: 'Exit preview' }));
  expect(screen).toHavePathname('/sign-in');
  expect(testRouter.canGoBack()).toBe(false);
  expect(screen.queryByRole('button', { name: 'Exit preview' })).toBeNull();
});

it('keeps tab selection usable without decorative animation when reduced motion is enabled', async () => {
  jest
    .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
    .mockResolvedValue(true);
  const spring = jest.spyOn(Animated, 'spring');
  const timing = jest.spyOn(Animated, 'timing');
  await renderRouter(routes, { initialUrl: '/sign-in' });
  await fireEvent.press(
    screen.getByRole('button', { name: 'Preview navigation' }),
  );
  await fireEvent.press(screen.getByRole('button', { name: /^History, tab/ }));
  expect(screen).toHavePathname('/history');
  expect(spring).not.toHaveBeenCalled();
  expect(timing).not.toHaveBeenCalledWith(
    expect.anything(),
    expect.objectContaining({ duration: 420 }),
  );
});

it('does not expose preview access outside development', async () => {
  const devMode = __DEV__;
  Object.defineProperty(globalThis, '__DEV__', { value: false });
  try {
    await renderRouter(routes, { initialUrl: '/add-entry' });
    await waitFor(() => expect(screen).toHavePathname('/sign-in'));
    expect(
      screen.queryByRole('button', { name: 'Preview navigation' }),
    ).toBeNull();
  } finally {
    Object.defineProperty(globalThis, '__DEV__', { value: devMode });
  }
});
