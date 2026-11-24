import { setupConvexAuth } from '@convex-dev/auth/server';
import { setupGoogle } from '@convex-dev/auth/methods/google/server';
import { components, internal } from './_generated/api';
import { env } from './_generated/server';

const auth = setupConvexAuth({
  component: components.auth,
  accessTokenTtlSeconds: 60,
  refreshInactivityTimeoutSeconds: 7 * 24 * 60 * 60,
  sessionMaxLifetimeSeconds: 30 * 24 * 60 * 60,
});
export const { signOut, refreshSession, isAuthenticated } = auth;

// Auth v2 accepts HTTP(S) origins. Our fixed HTTPS bridge hands only the
// one-time code back to Android; the secret flow state stays on the phone.
export const { startSignInWithGoogle, completeSignInWithGoogle } = setupGoogle(
  auth,
  {
    component: components.authGoogle,
    allowedRedirectOrigins: [env.CONVEX_SITE_URL],
  },
).attachUserCallbacks({
  createUser: internal.users.createGoogleUser,
  onSignIn: internal.users.syncGoogleProfile,
});
