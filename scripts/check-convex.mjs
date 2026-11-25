import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { ConvexReactClient } from 'convex/react';
import { ConvexError } from 'convex/values';
import { api } from '../convex/_generated/api.js';

if (existsSync('.env.local')) process.loadEnvFile('.env.local');
const url = process.env.EXPO_PUBLIC_CONVEX_URL;
if (!url)
  throw new Error('Run npm run convex:dev to configure .env.local first.');

// Exercise the same WebSocket client used by the app, against the real deployment.
const client = new ConvexReactClient(url, { unsavedChangesWarning: false });
const timeout = setTimeout(() => {
  console.error(
    'Convex check timed out. Check your connection and deployment.',
  );
  process.exit(1);
}, 30000);
try {
  assert.deepEqual(await client.query(api.health.check, {}), {
    service: 'joti',
    status: 'ok',
  });
  assert.equal(await client.query(api.auth.isAuthenticated, {}), false);
  await assert.rejects(
    client.query(api.users.current, {}),
    (error) =>
      error instanceof ConvexError && error.data?.code === 'UNAUTHENTICATED',
  );
  await assert.rejects(
    client.query(api.companies.list, {
      paginationOpts: { numItems: 1, cursor: null },
    }),
    (error) =>
      error instanceof ConvexError && error.data?.code === 'UNAUTHENTICATED',
  );
  // An invalid name makes this probe non-writing even if authorization regresses.
  await assert.rejects(
    client.mutation(api.companies.create, { name: '' }),
    (error) =>
      error instanceof ConvexError && error.data?.code === 'UNAUTHENTICATED',
  );
  console.log(
    'PASS: live app client connected; anonymous session is signed out; protected user/company reads and company creation denied.',
  );
} finally {
  clearTimeout(timeout);
  await client.close();
}
