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

For manual checks, run `npm start -- --clear` after this NativeWind setup change and scan the QR code with Expo Go on your physical phone. Keep the phone and computer on the same Wi-Fi network and use Expo Go compatible with SDK 58. Agents must not launch an emulator or start the manual-preview server automatically.

## Current scope

Tasks 1.1–1.3 are complete and the user has accepted the current design after a phone review in Expo Go. The app provides strict TypeScript, tooling, route groups, four placeholder tabs, and the global NativeWind design system, including dotted backgrounds, pill controls, fluid navigation, and animated icons. The Add Entry action opens a placeholder modal. See [the design system](docs/DESIGN_SYSTEM.md) for reference analysis, tokens, and usage. Original mascot assets and their intended-use map are in `assets/mascot/joti-2d/`; they are not yet integrated into screens. Task 1.4 remains unstarted.

Appearance follows the phone by default. **Settings → Appearance** offers System, Light, and Dark for the current session; selection resets on reload. Inter fonts load from bundled package assets. No reference-site text, images, logo, or other branding is included.

The initial screen is an authentication placeholder. In development, **Preview navigation** opens the shell; **Settings → Exit preview** returns to the placeholder and clears protected navigation history. Preview state lives in memory and resets on reload. Production builds have no preview entry point. There is no Google sign-in, user identity, persistence, or backend yet. Replace the preview provider/guards with real Convex Auth state in Phase 1.5; route guards never replace backend authorization.

## Organization

`app/` contains Expo Router layouts and screens, `components/` shared UI, `constants/` design tokens, and `lib/` theme and preview state. `hooks/`, `types/`, domain component folders, and `convex/lib/` are reserved for later work. `assets/` contains starter assets, and `tests/` contains `*.test.tsx` tests using Jest Expo and React Native Testing Library, including actual compiled NativeWind styles. No coverage percentage is imposed.

Read [the PRD](docs/PRD.md), [coding guidelines](docs/CODING_GUIDELINES.md), and [task tracker](docs/TASKS.md) before extending functionality. Router setup follows the [official Expo installation guide](https://docs.expo.dev/router/installation/) and [protected routes guide](https://docs.expo.dev/router/advanced/protected/).

## Verification notes

The foundation was initially launched in Expo Go 58.0.5 on an Android emulator. Subsequent manual checks use the user's phone; the user accepted the current task 1.3 design. Eighteen automated tests cover navigation, preview guards, design-system styles, responsiveness, and motion accessibility. Android bundle export is verified; native debug/release builds and an exhaustive physical-device test matrix are not yet verified.

The initial dependency audit reports 22 moderate transitive advisories, including three when development dependencies are omitted. npm's proposed automatic fix downgrades Expo; review compatible upstream fixes instead of running `npm audit fix --force`.
