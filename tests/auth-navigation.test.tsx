import {
  act,
  fireEvent,
  renderRouter,
  screen,
  testRouter,
  waitFor,
} from 'expo-router/testing-library';
import RootLayout from '@/app/_layout';
import AuthLayout from '@/app/(auth)/_layout';
import SignInScreen from '@/app/(auth)/sign-in';
import AuthCallbackScreen from '@/app/(auth)/auth-callback';
import ProtectedLayout from '@/app/(protected)/_layout';
import TabsLayout from '@/app/(protected)/(tabs)/_layout';
import HomeScreen from '@/app/(protected)/(tabs)/index';
import HistoryScreen from '@/app/(protected)/(tabs)/history';
import CompaniesScreen from '@/app/(protected)/(tabs)/companies';
import SettingsScreen from '@/app/(protected)/(tabs)/settings';
import AddEntryScreen from '@/app/(protected)/add-entry';
import type { useAuthSession } from '@/lib/auth-session';

const mockListeners = new Set<() => void>();
const initialAuth: ReturnType<typeof useAuthSession> = {
  isAuthenticated: false,
  isLoading: false,
  isSigningIn: false,
  isSigningOut: false,
  unavailableReason: null,
  error: null,
  signIn: jest.fn(async () => {}),
  signOut: jest.fn(async () => updateAuth({ isAuthenticated: false })),
  finishSignIn: jest.fn(async () => true),
};
let mockAuth = initialAuth;
const mockStore = {
  subscribe: (listener: () => void) => {
    mockListeners.add(listener);
    return () => {
      mockListeners.delete(listener);
    };
  },
  getSnapshot: () => mockAuth,
};
jest.mock('@/lib/auth-session', () => ({
  AuthSessionProvider: ({ children }: { children: React.ReactNode }) =>
    children,
  useAuthSession: () =>
    jest
      .requireActual<typeof import('react')>('react')
      .useSyncExternalStore(mockStore.subscribe, mockStore.getSnapshot),
}));

function updateAuth(value: Partial<typeof initialAuth>) {
  mockAuth = { ...mockAuth, ...value };
  mockListeners.forEach((listener) => listener());
}
const routes = {
  _layout: RootLayout,
  '(auth)/_layout': AuthLayout,
  '(auth)/sign-in': SignInScreen,
  '(auth)/auth-callback': AuthCallbackScreen,
  '(protected)/_layout': ProtectedLayout,
  '(protected)/(tabs)/_layout': TabsLayout,
  '(protected)/(tabs)/index': HomeScreen,
  '(protected)/(tabs)/history': HistoryScreen,
  '(protected)/(tabs)/companies': CompaniesScreen,
  '(protected)/(tabs)/settings': SettingsScreen,
  '(protected)/add-entry': AddEntryScreen,
};
beforeEach(() => {
  mockAuth = { ...initialAuth };
  jest.clearAllMocks();
});

test('session restoration shows loading before allowing a protected deep link', async () => {
  updateAuth({ isLoading: true });
  await renderRouter(routes, { initialUrl: '/history' });
  expect(screen.getByLabelText('Loading Joti')).toBeTruthy();
  expect(screen.queryByRole('header', { name: 'History' })).toBeNull();
  await act(() => updateAuth({ isLoading: false, isAuthenticated: true }));
  await waitFor(() => expect(screen).toHavePathname('/history'));
  expect(screen.getByRole('header', { name: 'History' })).toBeVisible();
});

test('verified authentication opens the app and manual sign-out removes navigation history', async () => {
  updateAuth({ isAuthenticated: true });
  await renderRouter(routes, { initialUrl: '/settings' });
  await fireEvent.press(screen.getByRole('button', { name: 'Sign out' }));
  await waitFor(() => expect(screen).toHavePathname('/sign-in'));
  expect(testRouter.canGoBack()).toBe(false);
  expect(initialAuth.signOut).toHaveBeenCalledTimes(1);
});

test('server session loss removes protected screens immediately', async () => {
  updateAuth({ isAuthenticated: true });
  await renderRouter(routes, { initialUrl: '/add-entry' });
  await act(() => updateAuth({ isAuthenticated: false }));
  await waitFor(() => expect(screen).toHavePathname('/sign-in'));
  expect(testRouter.canGoBack()).toBe(false);
});

test('sign-in failures remain visible and do not grant private access', async () => {
  updateAuth({
    error: 'Unable to sign in. Check your connection and try again.',
  });
  await renderRouter(routes, { initialUrl: '/sign-in' });
  expect(screen.getByRole('alert')).toHaveTextContent(/Unable to sign in/);
  await fireEvent.press(
    screen.getByRole('button', { name: 'Continue with Google' }),
  );
  expect(initialAuth.signIn).toHaveBeenCalledTimes(1);
  expect(screen).toHavePathname('/sign-in');
});

test('a cold-start OAuth callback waits for verified authentication before entering private screens', async () => {
  await renderRouter(routes, {
    initialUrl: '/auth-callback?convexAuthCode=one-time-code',
  });
  await waitFor(() =>
    expect(initialAuth.finishSignIn).toHaveBeenCalledWith(
      'joti://auth-callback?convexAuthCode=one-time-code',
    ),
  );
  expect(initialAuth.finishSignIn).toHaveBeenCalledTimes(1);
  expect(screen).toHavePathname('/auth-callback');
  await act(() => updateAuth({ isAuthenticated: true }));
  await waitFor(() => expect(screen).toHavePathname('/'));
});
