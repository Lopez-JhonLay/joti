import { AuthClient } from '@convex-dev/auth/browser';
import type { TokenBundle } from '@convex-dev/auth/react';
import { secureStorage } from '@/lib/secure-storage';
import * as SecureStore from 'expo-secure-store';

const mockStoredValues = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(
    async (key: string) => mockStoredValues.get(key) ?? null,
  ),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockStoredValues.set(key, value);
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    mockStoredValues.delete(key);
  }),
}));

const tokens: TokenBundle = {
  accessToken: 'access',
  refreshToken: 'refresh',
  refreshTokenExpiresAt: Date.now() + 100000,
  userId: 'user',
};
const refresh = jest.fn();
const revoke = jest.fn(async () => {});
const createClient = (namespace = 'deployment') =>
  new AuthClient({
    mode: 'spa',
    storage: secureStorage,
    storageNamespace: namespace,
    authApi: { refreshSession: refresh, signOut: revoke },
  });
beforeEach(() => {
  mockStoredValues.clear();
  jest.clearAllMocks();
});

test('a new session manager restores persisted tokens across a simulated process restart', async () => {
  const first = createClient();
  await first.init();
  await first.setSession(tokens);
  first.dispose();
  const restarted = createClient();
  await restarted.init();
  expect(restarted.getSnapshot().isAuthenticated).toBe(true);
  expect(await restarted.fetchAccessToken({ forceRefreshToken: false })).toBe(
    'access',
  );
  restarted.dispose();
});

test('sign-out revokes the session and a restarted client stays signed out', async () => {
  const first = createClient();
  await first.init();
  await first.setSession(tokens);
  await first.signOut();
  expect(revoke).toHaveBeenCalledWith('refresh');
  expect(mockStoredValues.size).toBe(0);
  first.dispose();
  const restarted = createClient();
  await restarted.init();
  expect(restarted.getSnapshot().isAuthenticated).toBe(false);
  restarted.dispose();
});

test('a server-expired session is cleared rather than restoring private access', async () => {
  const client = createClient();
  await client.init();
  await client.setSession(tokens);
  refresh.mockResolvedValueOnce({ kind: 'noSession' });
  expect(await client.fetchAccessToken({ forceRefreshToken: true })).toBeNull();
  expect(client.getSnapshot().isAuthenticated).toBe(false);
  expect(mockStoredValues.size).toBe(0);
  client.dispose();
});

test('deployments cannot restore each other’s sessions', async () => {
  const first = createClient('development');
  await first.init();
  await first.setSession(tokens);
  first.dispose();
  const other = createClient('production');
  await other.init();
  expect(other.getSnapshot().isAuthenticated).toBe(false);
  other.dispose();
});

test('unreadable native secure storage starts signed out without crashing restoration', async () => {
  jest
    .mocked(SecureStore.getItemAsync)
    .mockRejectedValueOnce(new Error('Storage locked'))
    .mockRejectedValueOnce(new Error('Storage locked'));
  const client = createClient();
  await client.init();
  expect(client.getSnapshot().isAuthenticated).toBe(false);
  expect(client.getSnapshot().isLoading).toBe(false);
  client.dispose();
});
