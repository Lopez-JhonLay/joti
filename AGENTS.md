# Repository Guidelines

## Project Structure & Module Organization

Joti is an Android-first private work journal using Expo, TypeScript, NativeWind, and Convex. Read `docs/PRD.md` (scope), `docs/CODING_GUIDELINES.md` (standards), `docs/DESIGN_SYSTEM.md` (visual conventions), and `docs/TASKS.md` (progress) before implementing changes.

## Design References — Every Session

At the start of every session, read `docs/designs/main-screens/wireframe-plan.md` and `docs/designs/supporting-screens/README.md`. Before UI work, visually inspect the relevant reference images. Start with `docs/designs/main-screens/main-screens-sheet-v5.png` for populated tabs and `first-use-flow-sheet-v2.png` for first use and company creation. Company detail/edit references are in `docs/designs/supporting-screens/organization-sheet-v1.png`; the company empty state is in `empty-and-project-sheet-v1.png`. Use the supporting-screen README to find the appropriate sheets for other features. Prefer these linked versions over older iterations unless the user selects another reference.

Use these references for screen composition, hierarchy, content density, navigation, and interaction. Preserve the existing light/dark themes and `constants/design-tokens.js`, `tailwind.config.js`, and `lib/theme.tsx`; do not copy colors or invent new tokens from mockup pixels unless the user explicitly requests a theme/token change. Compose semantic utilities and shared components with the existing tokens. The references refine `docs/DESIGN_SYSTEM.md` at the screen level; the PRD and current task boundary still determine which features are implemented.

Follow the compact title rows, plain divided lists, restrained section spacing, and open full-screen forms shown in the references. Companies has Add Company as its local primary action and no competing Add Entry action; Settings has no creation action. Keep tabs off full-screen forms, use calendar controls for dates, and place the form's primary Save action at the bottom while keeping it reachable when scrolling or the keyboard is open. Do not substitute placeholder heroes or dense card stacks. Use only real data for implemented sections; defer later-phase project/entry sections instead of inventing counts or enabling unfinished actions. Review changes against the relevant sheets and record remaining physical-phone checks in `docs/TASKS.md`.

## Module Layout

Follow this structure:

- `app/`: Expo Router routes, authentication groups, and screen composition.
- `components/`: reusable UI, grouped under `ui/`, `journal/`, `companies/`, and `projects/`.
- `hooks/`, `lib/`, `constants/`, `types/`: shared client code; `assets/`: static resources.
- `convex/`: schema, authentication, and domain functions such as `entries.ts`; shared backend helpers in `convex/lib/`.

Keep business logic out of route files and avoid unnecessary service layers.

## Build, Test, and Development Commands

Use Node.js 24 LTS and npm with `package-lock.json`. Run `npm ci` to install dependencies and `npm start` for Metro. Run `npm run check` for frontend/backend TypeScript, ESLint, and Prettier; `npm test` for automated tests; and `npm run format` to format files. `npm run export:android` bundles JavaScript/assets; `npm run build:android` compiles a local debug app with Android SDK/JDK. Run `npm run convex:dev` separately for backend development, `npm run convex:push` for a one-time development deployment, and `npm run convex:check` for live connectivity/anonymous authorization checks. See `docs/CONVEX_SETUP.md`; commit generated Convex types and keep environment files private.

## Coding Style & Naming Conventions

Use strict TypeScript, functional React components, and hooks. Avoid `any`; reuse generated Convex types. Use two-space indentation when establishing formatting, centralized Prettier configuration, and Expo-compatible ESLint rules.

Use kebab-case filenames (`entry-form.tsx`), PascalCase components/types, camelCase functions/variables, `use`-prefixed hooks, and UPPER_SNAKE_CASE constants. Convex function paths require underscores instead of hyphens (`convex/lib/mobile_auth.ts`). Preserve Expo Router filenames such as `_layout.tsx`. Prefer named exports except where routing requires defaults.

Use semantic NativeWind classes and shared primitives from `components/ui/`. Edit palette/layout tokens in `constants/design-tokens.js`, utility mappings in `tailwind.config.js`, and shared component classes in `global.css`. Keep native navigation colors aligned through `lib/theme.tsx`.

Use `AnimatedIcon` and `Button icon` for icons. Follow the Lucide Animated motion direction through the native Lucide/Animated adapter; do not install DOM/Motion components in the Expo app. Keep labels accessible, animations brief and interaction-driven, and honor the OS reduced-motion preference.

Follow the app-wide motion principles in `docs/DESIGN_SYSTEM.md`: use smooth, fluid transitions wherever they clarify interaction or feedback, support interruption, and never delay user actions for decoration.

## Testing Guidelines

Do not start an Android emulator or simulator, launch Android, or start Metro for manual checks. The user runs phone checks themselves. For Expo Go design previews, provide `npm run start:go` and instructions to scan the QR code on the same Wi-Fi. Google OAuth requires Joti's physical-phone development build, not Expo Go: explain this distinction and provide `npm run build:android -- --device` for the user to build/install on their connected phone, followed by `npm run start:dev` for later sessions. See `docs/GOOGLE_AUTH_SETUP.md`. Continue running automated checks and bundle exports as appropriate.

Use Jest Expo and React Native Testing Library in `tests/*.test.tsx`; keep tests outside `app/`. Navigation integration tests cover guarded deep links, tabs, modal navigation, and preview exit. As features arrive, prioritize validation, cross-user authorization, stale autosaves, retry behavior, attachments, Trash, and CSV escaping. No percentage threshold is specified.

## Commit & Pull Request Guidelines

Follow the existing `feat:` commit style and documented prefixes: `fix:`, `refactor:`, `test:`, and `docs:`. Keep commits focused. PRs should explain behavior changes, reference relevant requirements or issues, report validation and limitations, and include screenshots for UI changes.

## Security & Agent Workflow

Enforce ownership and input validation on the backend. Never log credentials or private journal content. Keep Google OAuth secrets in Convex environment variables. Use the fixed HTTPS callback bridge and SecureStore-backed Convex Auth v2 sessions; preview grants no backend identity. Task 1.5 phone acceptance is recorded in `docs/TASKS.md`; distinguish user-confirmed device checks from automated tests and untested release-hardening scenarios. Follow approved design references and keep implementation within the PRD's MVP scope.
