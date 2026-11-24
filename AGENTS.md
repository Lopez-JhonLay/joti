# Repository Guidelines

## Project Structure & Module Organization

Joti is an Android-first private work journal using Expo and TypeScript, with NativeWind and Convex planned. Read `docs/PRD.md` (scope), `docs/CODING_GUIDELINES.md` (standards), and `docs/TASKS.md` (progress) before implementing changes.

Follow this structure:

- `app/`: Expo Router routes, authentication groups, and screen composition.
- `components/`: reusable UI, grouped under `ui/`, `journal/`, `companies/`, and `projects/`.
- `hooks/`, `lib/`, `constants/`, `types/`: shared client code; `assets/`: static resources.
- `convex/`: schema, authentication, and domain functions such as `entries.ts`; shared backend helpers in `convex/lib/`.

Keep business logic out of route files and avoid unnecessary service layers.

## Build, Test, and Development Commands

Use Node.js 24 LTS and npm with `package-lock.json`. Run `npm ci` to install dependencies, `npm start` for Metro, and `npm run android` to launch Expo Go on Android. Run `npm run check` for TypeScript, ESLint, and Prettier; `npm test` for navigation integration tests; and `npm run format` to format files. `npm run export:android` bundles JavaScript/assets; `npm run build:android` compiles a local debug app with Android SDK/JDK. Convex is not configured yet.

## Coding Style & Naming Conventions

Use strict TypeScript, functional React components, and hooks. Avoid `any`; reuse generated Convex types. Use two-space indentation when establishing formatting, centralized Prettier configuration, and Expo-compatible ESLint rules.

Use kebab-case filenames (`entry-form.tsx`), PascalCase components/types, camelCase functions/variables, `use`-prefixed hooks, and UPPER_SNAKE_CASE constants. Preserve Expo Router filenames such as `_layout.tsx`. Prefer named exports except where routing requires defaults.

## Testing Guidelines

Do not start an Android emulator or simulator. The user tests manually in Expo Go on their physical phone. Provide `npm start` and instruct them to scan the QR code with the phone and computer on the same Wi-Fi network; let the user run the command. Do not automatically launch Android or start Metro for manual checks. Continue running automated tests and static checks as appropriate.

Use Jest Expo and React Native Testing Library in `tests/*.test.tsx`; keep tests outside `app/`. Navigation integration tests cover guarded deep links, tabs, modal navigation, and preview exit. As features arrive, prioritize validation, cross-user authorization, stale autosaves, retry behavior, attachments, Trash, and CSV escaping. No percentage threshold is specified.

## Commit & Pull Request Guidelines

No Git history is available. Follow the documented prefixes: `feat:`, `fix:`, `refactor:`, `test:`, and `docs:`. Keep commits focused. PRs should explain behavior changes, reference relevant requirements or issues, report validation and limitations, and include screenshots for UI changes.

## Security & Agent Workflow

Enforce ownership and input validation on the backend. Never log credentials or private journal content. Validate Expo compatibility with Convex Auth and Google OAuth before dependent work. Follow approved design references and keep implementation within the PRD's MVP scope.
