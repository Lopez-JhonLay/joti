import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api.js';

if (existsSync('.env.local')) process.loadEnvFile('.env.local');
const url = process.env.EXPO_PUBLIC_CONVEX_URL;
const siteUrl = process.env.EXPO_PUBLIC_CONVEX_SITE_URL;
if (!url || !siteUrl)
  throw new Error('Configure the Convex deployment and site URLs first.');
const client = new ConvexHttpClient(url, { logger: false });
const redirectTo = `${siteUrl}/mobile-auth/complete`;
const flow = await client.mutation(api.auth.startSignInWithGoogle, {
  redirectTo,
});
const authorization = new URL(flow.redirect);
assert.equal(authorization.origin, 'https://accounts.google.com');
assert.equal(
  authorization.searchParams.get('redirect_uri'),
  `${siteUrl}/oauth/google/callback`,
);
assert.equal(authorization.searchParams.get('code_challenge_method'), 'S256');
assert.ok(
  authorization.searchParams
    .get('client_id')
    ?.endsWith('.apps.googleusercontent.com'),
);
assert.ok(flow.state);
await assert.rejects(
  client.mutation(api.auth.startSignInWithGoogle, {
    redirectTo: 'https://example.invalid',
  }),
);
const rejected = await client.mutation(api.auth.completeSignInWithGoogle, {
  code: 'invalid-code',
  state: 'invalid-state',
});
assert.equal(rejected.status, 'error');
const response = await fetch(`${redirectTo}?convexAuthCode=smoke-check`, {
  signal: AbortSignal.timeout(10000),
});
assert.equal(response.status, 200);
assert.equal(response.headers.get('Cache-Control'), 'no-store');
assert.ok(
  (await response.text()).includes(
    'joti://auth-callback?convexAuthCode=smoke-check',
  ),
);
console.log(
  'PASS: Google authorization URL, PKCE, callback bridge, redirect allowlist, and invalid-code rejection.',
);
console.log(
  'A real Google login and physical-phone restart check are still required.',
);
