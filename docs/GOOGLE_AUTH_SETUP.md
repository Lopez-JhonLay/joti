# Google Authentication Setup

Task 1.5 is **complete**. On 2026-11-24, the user confirmed successful Google sign-in and Convex connectivity on the physical Android phone, session restoration after force-close/reopen, manual sign-out with no Back access to private screens, and persistent signed-out state after another restart. The live `auth:check`, 54 automated tests, static checks, Android export, and ARM64 debug APK build also passed. The broader checklist below remains useful for regression and release hardening; only the phone checks explicitly recorded here are confirmed.

## Phone development build

A development build is Joti's own installable Android APK with Expo developer tools. It connects to Metro and receives JavaScript updates like Expo Go, but owns the `joti://` callback scheme. Rebuild after changing native dependencies or app configuration; ordinary TypeScript/style changes need only Metro.

Google OAuth cannot be tested in Expo Go. The app detects Expo Go and disables Google sign-in with an explanation; development-only design preview remains available. Preview provides no identity or private backend access and is absent in production.

For a local phone build using the existing Android SDK/JDK:

1. Enable Android Developer options and USB debugging. Connect the physical phone by USB and accept the computer's debugging authorization.
2. Run `adb devices` and confirm the phone appears as `device`.
3. Run `npm run build:android -- --device` and select the physical phone. This builds/installs Joti and starts its development server. Do not select or start an emulator.
4. On later sessions, run `npm run convex:dev` in one terminal and `npm run start:dev` in another, then open Joti on the phone. The phone and computer need a reachable Metro connection, normally the same Wi-Fi.

For Expo Go design previews only, use `npm run start:go`. No build or server is automatically launched by the agent.

### Windows native build paths

The Expo config plugin `plugins/with-windows-native-paths.js` places app CMake intermediates in the shorter repository-root `.cxx/` folder and asks CMake to hash long object paths at 240 characters. This addresses Ninja's 260-character path failure without moving the repository. The generated cache is ignored by Git and formatting tools. After pulling this configuration into an existing native project, run `npx expo prebuild --platform android --no-install` before rebuilding. Keep this setting in the plugin instead of editing generated Gradle files; it survives native regeneration.

## Google Cloud and Convex configuration

1. Open [Google Cloud Console](https://console.cloud.google.com/), create/select a Joti project, and open **Google Auth Platform**.
2. Complete **Branding**: app name Joti, support email, and contact email.
3. Under **Audience**, choose External for personal Google accounts. While in Testing, add your account to Test users.
4. Under **Clients**, create a **Web application** client named Joti development. Google calls the backend rather than the Android app, so this flow needs a web client, not an Android client or SHA fingerprint.
5. Add this exact **Authorized redirect URI**, without a trailing slash:

   ```text
   https://harmless-rhinoceros-278.convex.site/oauth/google/callback
   ```

6. Copy the client ID and secret into the [development deployment's environment settings](https://dashboard.convex.dev/d/harmless-rhinoceros-278/settings/environment-variables), named `AUTH_GOOGLE_CLIENT_ID` and `AUTH_GOOGLE_CLIENT_SECRET`. Never place the secret in an `EXPO_PUBLIC_` variable, Git, or chat.
7. Run `npm run convex:push`, `npm run convex:check`, and `npm run auth:check`. The last command verifies the authorization URL, PKCE, return bridge, redirect allowlist, and invalid-code rejection; it cannot prove a real Google login.

No authorized JavaScript origins, Firebase setup, Google service-account key, or `google-services.json` is needed for this server callback flow. Production needs its own deployment configuration and exact Google callback registration.

## Callback and session behavior

Convex Auth v2 currently accepts only HTTP(S) OAuth return origins. It handles Google's `/oauth/google/callback`, exchanges Google's code server-side, and forwards its own one-time result to `/mobile-auth/complete`. That fixed HTTPS bridge shows **Continue to Joti**, linking to `joti://auth-callback`. It accepts no arbitrary return destination and disables caching/referrers.

The phone stores initiation state in SecureStore before opening Google's system-browser session. It redeems the result with that state and adopts the tokens through `ConvexAuthProvider`. Both browser delivery and a cold-start Expo Router callback are supported; duplicate delivery shares one completion. Cancelled, missing, expired, replayed, and failed flows never establish authentication. No Google tokens or raw profile data are written to app logs.

SecureStore holds access/refresh tokens in a deployment-specific namespace. Auth v2 rotates refresh tokens, restores sessions on launch, and reacts to server revocation. Route guards wait for Convex's authentication handshake; they do not trust a saved boolean. An unreadable secure store starts signed out. Manual sign-out attempts server revocation and clears local tokens; when offline, server revocation cannot be guaranteed, and the server lifetime limits remain applicable.

### Inactivity policy

The configured server policy is **7 days without a token refresh**, with a **30-day absolute session lifetime** and **60-second access tokens**. Convex rejects expired refreshes on the server; an already-issued access token can remain usable until its short expiry. Revoked sessions also fail backend ownership helpers.

This measures refresh inactivity: an online app can refresh while the user is not touching the screen. It is not a seven-day “last tap” timer. A stricter user-interaction timeout requires a separate server-enforced activity model; final inactivity hardening remains scheduled for Phase 5. Local navigation timers are not used as the security boundary.

## Physical-phone acceptance checklist

- Sign in with a configured test Google account; tap Continue to Joti and confirm Home opens.
- Cancel Google sign-in, then retry successfully. Confirm useful feedback and no private access on failure.
- Close/force-stop Joti and reopen it. Confirm the same session restores without a sign-in screen flash.
- Restart during the browser flow, then complete it; confirm the pending device flow resumes or gives a safe retry message.
- Sign out from Settings, confirm Back cannot reopen private screens, then restart and confirm signed-out state persists.
- Open protected deep links while signed out and confirm redirection to sign-in.
- Test network loss/recovery and session revocation. Confirm stale UI does not grant backend access.

Automated tests simulate process restart with the real Auth v2 session manager and a mocked SecureStore native boundary. They do not replace testing Android Keystore, Google consent, browser handoff, or physical-phone restarts.

References: [Convex Auth v2 OAuth](https://docs.convex.dev/auth/convex-auth/methods/oauth), [Expo authentication](https://docs.expo.dev/guides/authentication/), [Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/), [Google web-server OAuth](https://developers.google.com/identity/protocols/oauth2/web-server).
