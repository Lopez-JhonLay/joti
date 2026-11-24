import type { TokenBundle, TokenStorage } from '@convex-dev/auth/react';

export const GOOGLE_RETURN_URL = 'joti://auth-callback';
const FLOW_LIFETIME_MS = 10 * 60 * 1000;

type Dependencies = {
  storage: TokenStorage;
  storageKey: string;
  redirectTo: string;
  start: (redirectTo: string) => Promise<{ redirect: string; state: string }>;
  complete: (args: {
    state: string;
    code: string;
  }) => Promise<
    { status: 'complete'; tokens: TokenBundle } | { status: 'error' }
  >;
  adoptSession: (tokens: TokenBundle) => Promise<void>;
  discardSession: (tokens: TokenBundle) => Promise<void>;
  openBrowser: (
    url: string,
    returnUrl: string,
  ) => Promise<{ type: string; url?: string }>;
  now?: () => number;
};

export class SignInError extends Error {}

function callbackParams(url: string) {
  const parsed = new URL(url);
  if (
    parsed.protocol !== 'joti:' ||
    parsed.hostname !== 'auth-callback' ||
    !['', '/'].includes(parsed.pathname) ||
    parsed.username ||
    parsed.password ||
    parsed.port
  ) {
    throw new SignInError('Invalid sign-in callback. Please try again.');
  }
  return parsed.searchParams;
}

export function createGoogleAuthFlow(deps: Dependencies) {
  const now = deps.now ?? Date.now;
  let starting = false;
  let completion: { url: string; promise: Promise<void> } | null = null;
  const currentCompletion = () => completion;

  async function redeem(url: string) {
    const params = callbackParams(url);
    const saved = await deps.storage.getItem(deps.storageKey);
    if (!saved)
      throw new SignInError(
        'This sign-in was not started on this device. Please try again.',
      );
    let pending: { state: string; createdAt: number };
    try {
      pending = JSON.parse(saved);
      if (
        typeof pending.state !== 'string' ||
        !pending.state ||
        typeof pending.createdAt !== 'number'
      )
        throw new Error();
    } catch {
      await deps.storage.removeItem(deps.storageKey);
      throw new SignInError('This sign-in has expired. Please try again.');
    }
    if (
      now() - pending.createdAt > FLOW_LIFETIME_MS ||
      pending.createdAt > now()
    ) {
      await deps.storage.removeItem(deps.storageKey);
      throw new SignInError('This sign-in has expired. Please try again.');
    }
    const error = params.get('convexAuthError');
    if (error) {
      await deps.storage.removeItem(deps.storageKey);
      throw new SignInError(
        error === 'access_denied'
          ? 'Google sign-in was cancelled. You can try again.'
          : 'Google sign-in could not finish. Please try again.',
      );
    }
    const code = params.get('convexAuthCode');
    if (!code || code.length > 2048)
      throw new SignInError('Invalid sign-in result. Please try again.');
    const result = await deps.complete({ state: pending.state, code });
    if (result.status !== 'complete') {
      await deps.storage.removeItem(deps.storageKey);
      throw new SignInError(
        'This sign-in link is expired or already used. Please try again.',
      );
    }
    try {
      await deps.adoptSession(result.tokens);
    } catch {
      await deps.discardSession(result.tokens);
      throw new SignInError(
        'Your session could not be saved securely. Please try again.',
      );
    } finally {
      await deps.storage.removeItem(deps.storageKey);
    }
  }

  async function finish(url: string): Promise<void> {
    // The browser result and Expo Router callback can arrive together.
    const params = callbackParams(url);
    const key = JSON.stringify([
      params.get('convexAuthCode'),
      params.get('convexAuthError'),
    ]);
    if (completion?.url === key) return completion.promise;
    if (completion)
      return Promise.reject(
        new SignInError('A sign-in result is already being processed.'),
      );
    const promise = redeem(url);
    completion = { url: key, promise };
    // Keep a successful completion for duplicate delivery; let transient failures retry.
    void promise.catch(() => {
      completion = null;
    });
    return promise;
  }

  return {
    finish,
    async start() {
      if (starting) return;
      starting = true;
      completion = null;
      try {
        const flow = await deps.start(deps.redirectTo);
        // Store proof of initiation before leaving the app. It survives process death.
        await deps.storage.setItem(
          deps.storageKey,
          JSON.stringify({ state: flow.state, createdAt: now() }),
        );
        const result = await deps.openBrowser(flow.redirect, GOOGLE_RETURN_URL);
        if (result.type === 'success' && result.url) {
          await finish(result.url);
        } else if (currentCompletion()) {
          await currentCompletion()!.promise;
        } else {
          await deps.storage.removeItem(deps.storageKey);
          throw new SignInError(
            'Google sign-in was cancelled. You can try again.',
          );
        }
      } finally {
        starting = false;
      }
    },
  };
}
