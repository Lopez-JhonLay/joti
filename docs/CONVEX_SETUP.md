# Convex Development Setup

Joti uses Convex cloud development with Convex Auth v2. The personal team's `joti` project is initialized; no additional dashboard steps are needed for task 1.4.

## Run locally

1. Install dependencies with `npm ci` (Node 24).
2. Run `npm run convex:dev` in one terminal. On a new machine, log in and select the existing personal-team `joti` project and a development deployment. The CLI writes `.env.local`, including `CONVEX_DEPLOYMENT`, `EXPO_PUBLIC_CONVEX_URL`, and `EXPO_PUBLIC_CONVEX_SITE_URL`.
3. For Google sign-in, install the phone development build and run `npm run start:dev`; see `docs/GOOGLE_AUTH_SETUP.md`. For design previews in Expo Go, use `npm run start:go` and scan the QR code on your phone on the same Wi-Fi. Restart Metro after changing environment variables. Do not start an emulator.

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

### Organization schema (task 2.1)

`companies` stores the owner, name, optional job title and employment dates, and creation/update timestamps. `projects` stores the owner, company ID, name, optional description, `active`/`archived` status, server-controlled `isGeneral` flag, and timestamps. Employment dates are date-only `YYYY-MM-DD` strings; timestamps are epoch milliseconds. Company mutations enforce nonblank names and valid calendar dates/ranges; project mutations validate names, descriptions, and statuses. Shared Zod schemas support client validation and independent backend enforcement.

Indexes support companies by owner; projects by owner, company, owner/company/status, and company/built-in flag. The last index supports looking up General / Adhoc. The index alone is not unique: task 2.4 enforces uniqueness through the indexed range read and insert in one Convex mutation transaction, with competing writes retried by Convex. All app writers that set `isGeneral: true` use this helper. Project mutations reject editing or archiving a flagged built-in record.

Reuse the field and argument validators in `lib/organization_validators.ts`. Client payloads exclude ownership, timestamps, and `isGeneral`; future mutations must set these on the server. Use `requireOwnedCompany` before project creation or reassignment, `requireOwnedProject` for project access (including parent ownership), and `requireCompanyProject` before associating a company/project pair. These helpers work with query and mutation contexts and are ordinary backend helpers, not public endpoints. Archived projects remain valid historical relationships; future write/selection rules must handle their status explicitly. The schema alone does not enforce foreign keys or row access: every future endpoint must call the appropriate helper before returning or writing private records.

### Company management (task 2.2)

`companies.ts` exposes owner-filtered, paginated `list`, private `get`, and authorized `create`, `update`, and `remove`. Missing/foreign detail reads both return `null`; mutations use the shared unavailable-record error. Names and job titles are trimmed and limited to 200 characters. Job titles and both dates are optional; blank optional fields are cleared. Dates must be real `YYYY-MM-DD` calendar dates, and an end date cannot precede a supplied start date. Updates replace all editable fields, while retaining owner and creation metadata. All timestamps come from the server.

Deletion checks the company index transactionally and rejects named projects, including archived ones. Task 2.4 allows an otherwise empty company's built-in category to be removed only together with its confirmed parent deletion; its ownership is verified and both records are removed in the same transaction. Task 3.1 also blocks all entries by company ID, including General / Adhoc, drafts, and Trash, and independently checks General's project ID before cleanup. Neither dependency check filters by owner or deletion status, so corrupt ownership/relationships fail closed. There is no standalone built-in delete action.

The Companies tab uses reactive pagination and plain divided company rows. Company create/detail/edit routes are protected by the existing authentication guard; development preview mounts no private company hooks. Forms retain input on failure, prevent duplicate in-flight submissions, warn before discarding changes, and disable new writes while disconnected. A save already in flight may complete after leaving; the navigation warning explains this. Employment dates use native Android calendar controls and retain `YYYY-MM-DD` storage through local date components without UTC conversion.

The date picker is a new native dependency. Rebuild/install the Joti development build on a connected physical phone with `npm run build:android -- --device`, including when an older development build is already installed. Later sessions use `npm run start:dev`. Phone acceptance is separate from automated navigation/UI tests. Expo Go cannot exercise authenticated company CRUD; `npm run start:go` is for unauthenticated design preview only, using its QR code on the same Wi-Fi.

### Project management (task 2.3)

`projects.ts` exposes company-scoped, owner-filtered pagination with an optional Active/Archived status filter, private project/company detail, and authorized `create`, `update`, and `setStatus` mutations. Every operation validates the parent company's ownership; foreign, missing, and broken-parent detail reads all return `null`. New projects are Active, owned by the authenticated company owner, and never built-in categories. Names are trimmed, required, and limited to 200 characters; descriptions are optional, trimmed, and limited to 4,000 characters. Full-form edits explicitly clear omitted descriptions. Company, owner, creation metadata, and `isGeneral` cannot be changed through editing.

Project creation starts inside a company. The form shows that company as fixed context instead of offering a move between employers. Detail screens support editing, confirmed archiving, and restoring to Active. Company project lists default to All and can filter Active or Archived; archived records remain readable and are never deleted by a status change. Repeating the current status is a no-op. General / Adhoc provisioning is implemented separately in task 2.4 below.

No standalone permanent project deletion endpoint or action is exposed; archiving is the supported named-project lifecycle operation. The only built-in cleanup is the confirmed empty-company transaction described above. Any future permanent-delete implementation must first check all entry dependencies, including drafts and Trash. No entry table, saved entries/counts, or end-to-end historical-entry preservation is claimed before Phase 3.

The UI reuses shared `ScreenFrame`, `QueryBoundary`, `Feedback`, and request-error handling under `components/ui/` and `lib/request-errors.ts`, retaining the existing company layouts and icon-only company actions. Archive/restore confirmations use a reduced-motion-aware bottom sheet. Task 2.3 adds no native dependencies: use `npm run start:dev` with the existing development build once the earlier calendar-module build is installed. Automated mocks cover project authorization and state changes; physical-phone acceptance and actual entry-backed archive workflows remain separate checks.

### General / Adhoc (task 2.4)

Company creation now provisions its owned, Active, flagged General / Adhoc project in the same transaction. `lib/general_projects.ts` is the only built-in writer. The authenticated `projects:ensureGeneral` mutation can retry setup or repair canonical name/status without replacing the existing ID; `projects:general` returns the owned, canonical, Active category. Both validate company ownership. Ordinary project names reserve case/spacing variants of `General / Adhoc`; legacy ordinary same-name records are preserved rather than renamed, merged, or converted. A corrupted duplicate flagged state fails closed and is reported by the internal audit.

Existing companies use the admin-only `general_projects:backfill` mutation. It processes at most 100 companies per transaction and schedules continuation pages; rerunning is idempotent. `general_projects:audit` returns counts and a cursor only, with no company or journal content. Default development invocations are `npx convex run general_projects:backfill '{cursor:null}'` and `npx convex run general_projects:audit '{cursor:null}'`. Follow the audit cursor if it is not done. The development backfill was exercised concurrently and its final audit reported one checked company, zero missing, zero duplicates, and zero invalid categories.

Company details pin the built-in row in All/Active views, separate from named-project pagination via `namedOnly: true`. Add Entry now provides company and active project/category selection, defaulting to the selected company's actual General / Adhoc ID. Switching companies clears the old project; removed or newly archived named projects fall back to the current General category. Empty company choices link to Add Company, and missing-category setup provides offline/error/retry feedback. Preview mounts no private data hooks. These selections are temporary: journal fields, drafts, and entry persistence remain Phase 3. The selector emits validated current IDs for later form integration and does not create a journal record. No new native dependency or theme/token change was added.

### Security verification (task 2.5)

`tests/organization-runtime.test.ts` runs registered company/project functions with `convex-test` under Jest Expo. It uses the real Auth `getAuthUserId` resolver and component `getSession` query, with session rows seeded and revoked by test-only in-memory fixture mutations. No fixture endpoint exists in `convex/` or the deployment. The installed Auth component's compiled schema/query modules are imported directly because its public test helper requires Vite's `import.meta.glob`; dependency upgrades must keep these tests passing.

Coverage includes two-user isolation, anonymous/revoked/forged sessions, argument validation and protected fields, table-specific IDs, indexed pagination, normalized CRUD, relationship corruption, built-in protections, archive/restore and deletion guards, and rollback of company/category writes after simulated provisioning failure. This complements the handler and navigation tests. The runtime does not validate JWT signatures or reproduce deployment concurrency. `npm run convex:check` separately verifies live connectivity and anonymous user/company denial. The user confirmed all Phase 2 phone checks passed on 2026-11-25, including signed-out guards and cross-account isolation; see `docs/TASKS.md` for the device acceptance record, separate from automated evidence.

Task 2.5 changes only test infrastructure and documentation, so no backend redeployment or phone rebuild is required for that task. Task 3.1 adds the entry dependency guards described below; projects retain archive-only lifecycle behavior.

### Entry data model (task 3.1)

`entries` stores native `userId`, `companyId`, and `projectId` references. Persisted drafts always have company/project context; date, task, work description, beneficiaries, impact text/metrics, and notes may be absent. Work dates use date-only `YYYY-MM-DD` strings, while timestamps and optional `deletedAt` use epoch milliseconds. Metrics are optional free text for measurements with units rather than a required numeric structure. Attachments remain a separate Phase 4 entity.

Entry `status` is `draft` or `completed`, independent of `impactStatus` (`pending`, `known`, `not_measurable`). `impactCategories` is an array of `technical`, `business`, and/or `people` and may be empty on drafts. The structural schema checks types and enum values. Task 3.2 must enforce calendar dates, text limits, unique categories, completion's required fields, and lifecycle rules independently on the backend. No public entry read/write endpoint is exposed yet, and Add Entry still offers temporary organization selection only.

`lib/entries.ts` exposes ordinary backend helpers, not callable endpoints. `requireOwnedEntry` checks entry ownership, both parents' ownership/existence, and the company/project pair. Archived parents and Trash entries retain historical validity; each future endpoint must separately restrict new archived-project selection or editing deleted entries. `requireNoCompanyEntries` and `requireNoProjectEntries` use unfiltered dependency indexes. Call them after ownership checks in the same mutation as removal. Company deletion already uses both where appropriate; any future permanent project deletion must invoke its guard.

New entries start at `INITIAL_ENTRY_REVISION` (1). After authorization, future update/completion mutations must pass the stored entry and the client's expected revision to `nextEntryRevision`, then patch the returned revision and server timestamp with the content in that same mutation. Invalid client revisions yield `VALIDATION_ERROR`; stale/future revisions or invalid/exhausted stored revisions yield `CONFLICT`. The helper returns no private content in errors. Metadata is server-owned; revision checks are a foundation until task 3.2 integrates them into every endpoint.

| Index                            | Purpose                                                                |
| -------------------------------- | ---------------------------------------------------------------------- |
| `by_company`, `by_project`       | Dependency guards including all statuses, Trash, and corrupt ownership |
| `by_user_deleted_date`           | Owner's history/date ranges with Trash separated                       |
| `by_user_deleted_status_updated` | Owner's drafts ordered by latest update, with Trash separated          |
| `by_user_company_deleted_date`   | Private company history/date ranges                                    |
| `by_user_project_deleted_date`   | Private project history/date ranges                                    |

For active records, query the relevant `deletedAt` index prefix with `undefined`. Owner index prefixes must always be derived from the live session. Search, impact filters, retention cleanup, and attachment indexes will be added with their corresponding tasks. The additive schema and company deletion guards are deployed to development; existing organization data requires no migration. All task 3.1 test entries were written only inside `convex-test`, with no production test endpoint or live content writes. No native rebuild is required.

### Entry backend and autosave (tasks 3.2–3.6)

`entries.ts` now exposes authenticated `create`, `get`, paginated `list` (including `draftsOnly`), `update`, `complete`, and `discard`. Missing/foreign/trashed detail reads return `null`; writes enforce the unavailable-record error and live parent ownership. Creation uses an owned active project; edits can retain an existing archived relationship but cannot assign another archived project. Discard accepts Draft records only, checks the expected revision, and sets `deletedAt` rather than permanently deleting. Trash recovery/expiry cleanup remain Phase 5; no permanent entry/project deletion endpoint exists.

`lib/entry-validation.ts` is shared client/backend Zod validation. Draft text/date fields may be empty. Completed entries require a real date, nonblank task, and work description; subsequent edits preserve those requirements. Limits are 200 characters for task, 20,000 for work/impact/notes, and 4,000 for beneficiaries/metrics. Impact categories must be unique. Optional blanks normalize to absent fields, and full-content updates explicitly clear omitted optionals. Ownership, timestamps, revision, entry status transitions, and Trash metadata remain server-controlled.

`creationKey` plus `by_user_creation_key` makes draft creation retries idempotent per owner. `lastWriteId` recognizes an exact retry of the most recent accepted write at its previous expected revision; a different/older payload conflicts instead. Unchanged updates do not write or increment revisions. These identifiers provide uniqueness, not authorization. All endpoints still derive identity from the session. The client save queue owns each pending request and retries the same key, snapshot, and expected revision after response loss.

The three-step editor uses a 700 ms debounce and serializes all writes, retaining edits received during an in-flight save until acknowledgment. Failed/offline writes retain local text and require Retry. Conflict stops saving and offers an explicitly confirmed reload; it never automatically overwrites a newer revision. Completion flushes the current snapshot, then submits completion against the acknowledged revision. Edits after a failed completion are also saved before success navigation. Unmount cancels future debounce callbacks; in-flight server writes may still finish, which the navigation warning explains. Local unsaved content is not persisted as offline storage, and full offline operation remains out of scope.

Protected detail/edit and Entries/Drafts routes provide restoration and management; Home links to the entry list. Preview never mounts private entry hooks. Backend, form, queue, UI, live-session and guarded-router tests cover these contracts. The live connectivity probe now checks anonymous entry-list denial. Test journal content exists only in the in-memory runtime. Development deployment and Android bundle export passed; no native rebuild is required. Phase 3 phone acceptance is pending and is recorded separately in `docs/TASKS.md`.

The earlier task 3.1 section describes the initial model-only milestone; its deferred endpoint/content/revision enforcement is now implemented by task 3.2 above. Existing task 3.1 ownership/dependency helpers remain authoritative for all entry writers.

## Secrets and remaining authentication work

Project-detail entry browsing (2026-11-26): `entries:list` also accepts optional `projectId`. It authorizes the project and its parent company, then queries `by_user_project_deleted_date` with the live owner and `deletedAt: undefined`. Draft filtering occurs before pagination. General / Adhoc and archived named projects use the same path; all-project listings retain their existing behavior. Both the journal destination and project details share EntryList. This adds no schema migration or native dependency.

Keep `.env.local` and `.convex/` out of Git. `.env.example` documents configuration. `EXPO_PUBLIC_` variables are bundled into the app and must contain only public URLs, never credentials or deploy keys. Store future OAuth secrets in Convex environment variables.

Task 1.5 adds the Google OAuth component and requires `AUTH_GOOGLE_CLIENT_ID` and `AUTH_GOOGLE_CLIENT_SECRET` in the Convex deployment before pushing its backend changes. See `docs/GOOGLE_AUTH_SETUP.md` for setup and the remaining phone checks. Convex Auth v2 uses platform-signed tokens; do not follow legacy v1 instructions for manually generating JWT signing keys.
