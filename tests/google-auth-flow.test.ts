import type { TokenBundle } from '@convex-dev/auth/react';
import {
  createGoogleAuthFlow,
  GOOGLE_RETURN_URL,
} from '@/lib/google-auth-flow';

const tokens: TokenBundle = {
  accessToken: 'access',
  refreshToken: 'refresh',
  refreshTokenExpiresAt: 1000000,
  userId: 'user',
};
const callback = `${GOOGLE_RETURN_URL}?convexAuthCode=one-time-code`;

function setup() {
  const saved = new Map<string, string>();
  const storage = {
    getItem: jest.fn(async (key: string) => saved.get(key) ?? null),
    setItem: jest.fn(async (key: string, value: string) => {
      saved.set(key, value);
    }),
    removeItem: jest.fn(async (key: string) => {
      saved.delete(key);
    }),
  };
  const deps = {
    storage,
    storageKey: 'flow',
    redirectTo: 'https://deployment.convex.site/mobile-auth/complete',
    start: jest.fn(async () => ({
      redirect: 'https://accounts.google.com/authorize',
      state: 'device-secret',
    })),
    complete: jest.fn(async () => ({ status: 'complete' as const, tokens })),
    adoptSession: jest.fn(async () => {}),
    discardSession: jest.fn(async () => {}),
    openBrowser: jest.fn(async () => ({ type: 'success', url: callback })),
    now: () => 1000,
  };
  return { deps, saved, flow: createGoogleAuthFlow(deps) };
}

test('saves initiation proof before opening the browser and adopts the redeemed session', async () => {
  const { deps, flow, saved } = setup();
  deps.openBrowser.mockImplementation(async () => {
    expect(saved.get('flow')).toContain('device-secret');
    return { type: 'success', url: callback };
  });
  await flow.start();
  expect(deps.start).toHaveBeenCalledWith(deps.redirectTo);
  expect(deps.complete).toHaveBeenCalledWith({
    code: 'one-time-code',
    state: 'device-secret',
  });
  expect(deps.adoptSession).toHaveBeenCalledWith(tokens);
  expect(saved.has('flow')).toBe(false);
});

test('duplicate native and router callbacks redeem only once', async () => {
  const { deps, flow, saved } = setup();
  saved.set(
    'flow',
    JSON.stringify({ state: 'device-secret', createdAt: 1000 }),
  );
  await Promise.all([flow.finish(callback), flow.finish(callback)]);
  await flow.finish(callback);
  expect(deps.complete).toHaveBeenCalledTimes(1);
});

test('a restarted flow resumes using persisted proof', async () => {
  const { deps, saved } = setup();
  saved.set(
    'flow',
    JSON.stringify({ state: 'persisted-device-secret', createdAt: 900 }),
  );
  await createGoogleAuthFlow(deps).finish(callback);
  expect(deps.complete).toHaveBeenCalledWith({
    state: 'persisted-device-secret',
    code: 'one-time-code',
  });
});

test.each([
  [
    'https://attacker.example/auth-callback?convexAuthCode=code',
    'Invalid sign-in callback',
  ],
  ['joti://another-route?convexAuthCode=code', 'Invalid sign-in callback'],
  ['joti://auth-callback/path?convexAuthCode=code', 'Invalid sign-in callback'],
  [`${GOOGLE_RETURN_URL}?convexAuthError=access_denied`, 'cancelled'],
  [GOOGLE_RETURN_URL, 'Invalid sign-in result'],
])('rejects invalid or denied callbacks: %s', async (url, message) => {
  const { deps, flow, saved } = setup();
  saved.set(
    'flow',
    JSON.stringify({ state: 'device-secret', createdAt: 1000 }),
  );
  await expect(flow.finish(url)).rejects.toThrow(message);
  expect(deps.complete).not.toHaveBeenCalled();
  expect(deps.adoptSession).not.toHaveBeenCalled();
});

test.each([
  undefined,
  'invalid-json',
  JSON.stringify({ state: 'old', createdAt: -600000 }),
])(
  'rejects callbacks without valid unexpired device state',
  async (pending) => {
    const { deps, flow, saved } = setup();
    if (pending) saved.set('flow', pending);
    await expect(flow.finish(callback)).rejects.toThrow();
    expect(deps.complete).not.toHaveBeenCalled();
  },
);

test('browser cancellation clears pending flow and permits another attempt', async () => {
  const { deps, flow, saved } = setup();
  deps.openBrowser.mockResolvedValueOnce({ type: 'cancel', url: '' });
  await expect(flow.start()).rejects.toThrow('cancelled');
  expect(saved.has('flow')).toBe(false);
  await flow.start();
  expect(deps.adoptSession).toHaveBeenCalledTimes(1);
});

test('network failures do not authenticate and can retry the same callback', async () => {
  const { deps, flow, saved } = setup();
  saved.set(
    'flow',
    JSON.stringify({ state: 'device-secret', createdAt: 1000 }),
  );
  deps.complete.mockRejectedValueOnce(new Error('Offline'));
  await expect(flow.finish(callback)).rejects.toThrow('Offline');
  expect(deps.adoptSession).not.toHaveBeenCalled();
  await flow.finish(callback);
  expect(deps.adoptSession).toHaveBeenCalledTimes(1);
});

test('secure-storage write failure revokes the newly issued session', async () => {
  const { deps, flow } = setup();
  deps.adoptSession.mockRejectedValueOnce(new Error('Storage unavailable'));
  await expect(flow.start()).rejects.toThrow('could not be saved securely');
  expect(deps.discardSession).toHaveBeenCalledWith(tokens);
});
