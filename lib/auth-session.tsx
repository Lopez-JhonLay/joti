import { useAuthActions } from '@convex-dev/auth/react';
import { useConvex, useConvexAuth } from 'convex/react';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import { api } from '@/convex/_generated/api';
import { useBackendConfigured } from './convex-provider';
import { createGoogleAuthFlow, SignInError } from './google-auth-flow';
import { secureStorage } from './secure-storage';

type AuthSession = {
  isLoading: boolean;
  isAuthenticated: boolean;
  isSigningIn: boolean;
  isSigningOut: boolean;
  unavailableReason: string | null;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  finishSignIn: (url: string) => Promise<boolean>;
};

const AuthSessionContext = createContext<AuthSession | null>(null);
const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
const siteUrl = process.env.EXPO_PUBLIC_CONVEX_SITE_URL;
const unavailableReason = isExpoGo
  ? 'Google sign-in needs the Joti development build. Expo Go supports design previews only.'
  : !siteUrl
    ? 'Sign-in is not configured for this build.'
    : null;

function ConnectedAuthSession({ children }: PropsWithChildren) {
  const client = useConvex();
  const { isLoading, isAuthenticated } = useConvexAuth();
  const { setSession, signOut } = useAuthActions();
  const [isSigningIn, setSigningIn] = useState(false);
  const [isSigningOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const flow = useMemo(
    () =>
      createGoogleAuthFlow({
        storage: secureStorage,
        storageKey: `joti_google_flow_${client.url.replace(/[^a-zA-Z0-9]/g, '')}`,
        redirectTo: `${siteUrl}/mobile-auth/complete`,
        start: (redirectTo) =>
          client.mutation(api.auth.startSignInWithGoogle, { redirectTo }),
        complete: (args) =>
          client.mutation(api.auth.completeSignInWithGoogle, args),
        adoptSession: setSession,
        discardSession: async (tokens) => {
          try {
            await client.mutation(api.auth.signOut, {
              refreshToken: tokens.refreshToken,
            });
          } finally {
            await signOut();
          }
        },
        openBrowser: (url, returnUrl) =>
          WebBrowser.openAuthSessionAsync(url, returnUrl),
      }),
    [client, setSession, signOut],
  );

  async function runSignIn(action: () => Promise<void>): Promise<boolean> {
    setError(null);
    setSigningIn(true);
    try {
      if (unavailableReason) throw new SignInError(unavailableReason);
      await action();
      return true;
    } catch (cause) {
      setError(
        cause instanceof SignInError
          ? cause.message
          : 'Unable to sign in. Check your connection and try again.',
      );
      return false;
    } finally {
      setSigningIn(false);
    }
  }

  return (
    <AuthSessionContext.Provider
      value={{
        isLoading,
        isAuthenticated,
        isSigningIn,
        isSigningOut,
        error,
        unavailableReason,
        signIn: async () => {
          await runSignIn(() => flow.start());
        },
        finishSignIn: (url) => runSignIn(() => flow.finish(url)),
        signOut: async () => {
          setError(null);
          setSigningOut(true);
          try {
            await signOut();
          } catch {
            setError(
              'Unable to clear your session securely. Please try signing out again.',
            );
          } finally {
            setSigningOut(false);
          }
        },
      }}
    >
      {children}
    </AuthSessionContext.Provider>
  );
}

export function AuthSessionProvider({ children }: PropsWithChildren) {
  const configured = useBackendConfigured();
  if (configured)
    return <ConnectedAuthSession>{children}</ConnectedAuthSession>;
  return (
    <AuthSessionContext.Provider
      value={{
        isLoading: false,
        isAuthenticated: false,
        isSigningIn: false,
        isSigningOut: false,
        unavailableReason:
          'Connect the Convex development deployment before signing in.',
        error: null,
        signIn: async () => {},
        signOut: async () => {},
        finishSignIn: async () => false,
      }}
    >
      {children}
    </AuthSessionContext.Provider>
  );
}

export function useAuthSession() {
  const value = useContext(AuthSessionContext);
  if (!value) throw new Error('useAuthSession requires AuthSessionProvider');
  return value;
}
