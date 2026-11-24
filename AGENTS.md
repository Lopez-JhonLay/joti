# Repository Guidelines

## Project Structure & Module Organization

Joti is an Android-first private work journal using Expo, TypeScript, NativeWind, and Convex. Read `docs/PRD.md` (scope), `docs/CODING_GUIDELINES.md` (standards), `docs/DESIGN_SYSTEM.md` (visual conventions), and `docs/TASKS.md` (progress) before implementing changes.

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

Use kebab-case filenames (`entry-form.tsx`), PascalCase components/types, camelCase functions/variables, `use`-prefixed hooks, and UPPER_SNAKE_CASE constants. Preserve Expo Router filenames such as `_layout.tsx`. Prefer named exports except where routing requires defaults.

Use semantic NativeWind classes and shared primitives from `components/ui/`. Edit palette/layout tokens in `constants/design-tokens.js`, utility mappings in `tailwind.config.js`, and shared component classes in `global.css`. Keep native navigation colors aligned through `lib/theme.tsx`.

Use `AnimatedIcon` and `Button icon` for icons. Follow the Lucide Animated motion direction through the native Lucide/Animated adapter; do not install DOM/Motion components in the Expo app. Keep labels accessible, animations brief and interaction-driven, and honor the OS reduced-motion preference.

Follow the app-wide motion principles in `docs/DESIGN_SYSTEM.md`: use smooth, fluid transitions wherever they clarify interaction or feedback, support interruption, and never delay user actions for decoration.

## Testing Guidelines

Do not start an Android emulator or simulator. The user tests manually in Expo Go on their physical phone. Provide `npm start` and instruct them to scan the QR code with the phone and computer on the same Wi-Fi network; let the user run the command. Do not automatically launch Android or start Metro for manual checks. Continue running automated tests and static checks as appropriate.

Use Jest Expo and React Native Testing Library in `tests/*.test.tsx`; keep tests outside `app/`. Navigation integration tests cover guarded deep links, tabs, modal navigation, and preview exit. As features arrive, prioritize validation, cross-user authorization, stale autosaves, retry behavior, attachments, Trash, and CSV escaping. No percentage threshold is specified.

## Commit & Pull Request Guidelines

Follow the existing `feat:` commit style and documented prefixes: `fix:`, `refactor:`, `test:`, and `docs:`. Keep commits focused. PRs should explain behavior changes, reference relevant requirements or issues, report validation and limitations, and include screenshots for UI changes.

## Security & Agent Workflow

Enforce ownership and input validation on the backend. Never log credentials or private journal content. Validate Expo compatibility with Convex Auth and Google OAuth before dependent work. Follow approved design references and keep implementation within the PRD's MVP scope.
