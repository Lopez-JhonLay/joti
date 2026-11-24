import { setupConvexAuth } from '@convex-dev/auth/server';
import { components } from './_generated/api';

// Core session infrastructure only. Google OAuth is configured in task 1.5.
const auth = setupConvexAuth({ component: components.auth });
export const { signOut, refreshSession, isAuthenticated } = auth;
