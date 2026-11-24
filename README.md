# Joti

A private, Android-first work journal. Little notes. Big progress.

## Development

Use Node.js 24 LTS and npm. Install the locked dependencies with `npm ci`.

| Command                  | Purpose                                                                                            |
| ------------------------ | -------------------------------------------------------------------------------------------------- |
| `npm start`              | Start the Expo development server.                                                                 |
| `npm run android`        | Start Expo and open an Android emulator or connected device in Expo Go.                            |
| `npm run check`          | Run strict TypeScript, ESLint, and Prettier checks.                                                |
| `npm test`               | Run the navigation integration tests.                                                              |
| `npm run format`         | Format source and documentation.                                                                   |
| `npm run export:android` | Produce an Android JavaScript/assets bundle in `dist/`; this is not an APK.                        |
| `npm run build:android`  | Generate native Android files and compile/install a local debug app; requires Android SDK and JDK. |

Start an Android emulator from Android Studio or connect a device with USB debugging before running `npm run android`. Use an Expo Go version compatible with SDK 58.

## Current scope

Phase 1.1–1.2 provides strict TypeScript, tooling, route groups, and four placeholder tabs. The Add Entry action opens a placeholder modal. Screens deliberately use neutral temporary styling; approved visuals and NativeWind belong to Phase 1.3.

The initial screen is an authentication placeholder. In development, **Preview navigation** opens the shell; **Settings → Exit preview** returns to the placeholder and clears protected navigation history. Preview state lives in memory and resets on reload. Production builds have no preview entry point. There is no Google sign-in, user identity, persistence, or backend yet. Replace the preview provider/guards with real Convex Auth state in Phase 1.5; route guards never replace backend authorization.

## Organization

`app/` contains Expo Router layouts and screens, `components/` shared UI, and `lib/` shared client logic. `hooks/`, `constants/`, `types/`, domain component folders, and `convex/lib/` are reserved for later work. `assets/` contains starter assets, and `tests/` contains `*.test.tsx` integration tests using Jest Expo and React Native Testing Library. No coverage percentage is imposed.

Read [the PRD](docs/PRD.md), [coding guidelines](docs/CODING_GUIDELINES.md), and [task tracker](docs/TASKS.md) before extending functionality. Router setup follows the [official Expo installation guide](https://docs.expo.dev/router/installation/) and [protected routes guide](https://docs.expo.dev/router/advanced/protected/).

## Verification notes

The foundation was launched in Expo Go 58.0.5 on the Medium_Phone_API_36.1 Android emulator. Automated integration tests cover navigation and preview route guards. Android bundle export is verified; local native debug compilation, release builds, and physical-device testing are not yet verified.

The initial dependency audit reports 22 moderate transitive advisories, including three when development dependencies are omitted. npm's proposed automatic fix downgrades Expo; review compatible upstream fixes instead of running `npm audit fix --force`.
