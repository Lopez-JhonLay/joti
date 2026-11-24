# Convex Development Setup

Joti uses Convex cloud development with Convex Auth v2. The personal team's `joti` project is initialized; no additional dashboard steps are needed for task 1.4.

## Run locally

1. Install dependencies with `npm ci` (Node 24).
2. Run `npm run convex:dev` in one terminal. On a new machine, log in and select the existing personal-team `joti` project and a development deployment. The CLI writes `.env.local`, including `CONVEX_DEPLOYMENT`, `EXPO_PUBLIC_CONVEX_URL`, and `EXPO_PUBLIC_CONVEX_SITE_URL`.
3. Run `npm start` in another terminal. Scan the QR code in Expo Go on your phone, on the same Wi-Fi. Restart Metro after changing environment variables. Do not start an emulator.

The existing local deployment is `harmless-rhinoceros-278`. Open its [dashboard](https://dashboard.convex.dev/t/jhon-lopez/joti/harmless-rhinoceros-278) to inspect functions and data.

## Commands and verification

- `npm run convex:push`: generate types, typecheck, and deploy once to the selected development deployment.
- `npm run convex:codegen`: regenerate `convex/_generated/` API and database types; commit generated files and never edit them manually.
- `npm run convex:check`: use the app's WebSocket client against the real deployment; verify health, signed-out state, and rejection of a protected query.
- `npm run check` and `npm test`: check frontend/backend types, lint, formatting, and automated tests.

In development, enter navigation preview and open Settings. “Development backend” reports connectivity without treating preview as authentication. Missing configuration is reported explicitly; failed checks offer retry. Offline connections automatically reconnect.

## Backend boundaries

`schema.ts` owns app tables; authentication sessions and credentials live in the isolated Auth component configured in `convex.config.ts`. `auth.ts` exposes session infrastructure; `users.ts` demonstrates protected access; `health.ts` exposes only a public service status. Keep future company, project, entry, and attachment functions in their own domain modules as those tasks arrive.

Use `lib/auth.ts` to resolve the live server session and enforce record ownership. Never accept a caller's user ID as authorization. Missing and foreign records share an error to prevent ID enumeration.

## Secrets and remaining authentication work

Keep `.env.local` and `.convex/` out of Git. `.env.example` documents configuration. `EXPO_PUBLIC_` variables are bundled into the app and must contain only public URLs, never credentials or deploy keys. Store future OAuth secrets in Convex environment variables.

Google credentials, OAuth redirects, secure mobile session persistence, and authenticated route guards are task 1.5. No Google sign-in is enabled yet. Convex Auth v2 uses platform-signed tokens; do not follow legacy v1 instructions for manually generating JWT signing keys.
