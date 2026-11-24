import {
  fireEvent,
  renderRouter,
  screen,
  testRouter,
  waitFor,
} from 'expo-router/testing-library';

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
  await renderRouter(routes, { initialUrl: '/sign-in' });
  await fireEvent.press(
    screen.getByRole('button', { name: 'Preview navigation' }),
  );
  expect(screen).toHavePathname('/');

  for (const name of ['History', 'Companies', 'Settings', 'Home']) {
    await fireEvent.press(
      screen.getByRole('button', { name: new RegExp(`^${name}, tab`) }),
    );
    expect(screen.getByRole('header', { name })).toBeVisible();
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
