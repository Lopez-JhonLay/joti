# Joti — Development Task Tracker

## 1. Overview

This document tracks the development of **Joti**, a private work journal for documenting professional accomplishments.

**Tagline:** Little notes. Big progress.

### Project References

- `PRD.md` — Product requirements and scope.
- `CODING_GUIDELINES.md` — Technical and coding standards.
- `AGENTS.md` — Codex behavior and development workflow.
- `TASK.md` — Development tasks and progress.

### Development Rules

- Complete tasks in dependency order.
- Follow the PRD and coding guidelines.
- Keep implementations small and focused.
- Mark tasks complete only after verification.
- Record blockers and important decisions.
- Avoid implementing features outside the agreed MVP.
- Each phase must produce a usable, testable result.

### Progress

| Phase                      | Status      |
| -------------------------- | ----------- |
| 1. Project Foundation      | Complete    |
| 2. Companies & Projects    | Complete    |
| 3. Core Journal & Autosave | Complete    |
| 4. History & Attachments   | Not Started |
| 5. Data Management         | Not Started |
| 6. Testing & Release       | Not Started |

**Current Phase:** Phase 3 complete (implementation and automated verification; Phase 3 phone acceptance pending)

**Current Task:** 3.6 Testing complete; next: 4.1 Dashboard (not started)

**Overall Status:** In Progress; Phases 1–3 implementation complete; Phase 4 not started

Update progress as development continues.

---

## Phase 1 — Project Foundation

**Goal:** Establish a working Android app with authentication, navigation, and styling.

### 1.1 Project Initialization

- [x] Initialize Expo with React Native and TypeScript.
- [x] Configure the selected package manager and lockfile.
- [x] Enable strict TypeScript settings.
- [x] Configure ESLint and Prettier.
- [x] Configure path aliases.
- [x] Establish the agreed file-type folder structure.
- [x] Verify the application launches on Android.

### 1.2 Navigation

- [x] Install and configure Expo Router.
- [x] Create authentication and protected route groups.
- [x] Create placeholder Home, History, Companies, and Settings screens.
- [x] Configure primary tab navigation.
- [x] Add a prominent Add Entry action.
- [x] Handle loading and navigation transitions.

**Scope note:** Task 1.2 initially used an in-memory navigation preview. Tasks 1.4–1.5 now provide real Convex Auth state, secure sessions, and backend authorization. The development-only design preview remains separate and grants no backend identity; production builds cannot enter preview. The shared design system is implemented in 1.3.

### 1.3 Styling & Design System — Complete

**Reference:** The user supplied https://ramfranco.vercel.app/ instead of images/mockups. Study notes and adaptation decisions are in `docs/DESIGN_SYSTEM.md`.

- [x] Review approved UI references.
- [x] Extract light and dark color tokens.
- [x] Define typography, spacing, radius, and layout conventions.
- [x] Configure NativeWind.
- [x] Implement reusable foundational UI components.
- [x] Support light and dark themes.
- [x] Verify responsive layouts through automated viewport checks and user phone review.
- [x] Prepare optional mascot assets and document intended placements.

Responsive compiled-style checks cover 320, 390, 768, and 1024 logical points. On 2026-11-24, the user confirmed the current design looks fine in Expo Go and approved marking 1.3 complete. This records acceptance of the current phone review, not an exhaustive physical-device/font-scale/keyboard test matrix. The original 2D mascot sheet, nine separate transparent poses, and intended-use map are saved in `assets/mascot/joti-2d/`; screen integration remains deferred. The website study used source retrieval rather than computer control.

### 1.4 Convex Setup — Complete

- [x] Initialize Convex.
- [x] Configure development environment variables.
- [x] Set up Convex code generation.
- [x] Establish domain-based backend structure.
- [x] Configure authentication and authorization helpers.
- [x] Verify frontend-to-Convex communication.

Initialized the personal team's `joti` cloud project and development deployment `harmless-rhinoceros-278`. Convex Auth v2 provides session infrastructure; shared helpers enforce authenticated identity and ownership. The root app provider and development Settings connection check use generated API types. The live WebSocket smoke check confirms service health, signed-out state, and protected-query rejection. Automated tests cover ownership, missing configuration, retry, and disconnected status. Setup commands and environment handling are documented in `docs/CONVEX_SETUP.md`. Google OAuth, session persistence, and real route authentication remain in 1.5; no additional manual Convex setup is required for 1.4.

### 1.5 Google Authentication — Complete

- [x] Validate Convex Auth + Google OAuth compatibility with Expo Android.
- [x] Configure Google OAuth credentials and redirect handling.
- [x] Implement Google sign-in.
- [x] Implement secure session persistence.
- [x] Implement manual sign-out.
- [x] Protect authenticated application screens.
- [x] Handle authentication loading and failure states.
- [x] Verify session persistence after app restart.
- [x] Document the supported inactivity expiration approach.

Implementation uses Convex Auth v2's Google component, a fixed HTTPS-to-native callback bridge, SecureStore-backed tokens and pending OAuth state, session-aware route guards, and manual sign-out. Automated coverage includes cancellation, duplicate callbacks, simulated process restart, expired sessions, ownership, and private-route removal. The development-only design preview remains unauthenticated; backend authorization never accepts it. Server policy is seven days without a refresh and a 30-day absolute lifetime, not a last-touch timer. See `docs/GOOGLE_AUTH_SETUP.md` for setup and verification details. The user reported a passing live `auth:check` after configuring credentials/deployment. Fixed Windows Ninja path overflow through a persistent Expo config plugin; the ARM64 debug APK compiles successfully.

**Phone acceptance (2026-11-24):** The user successfully signed in with Google and observed the Convex connection, then confirmed all three requested checks passed: force-close/reopen preserves the signed-in session; manual sign-out returns to sign-in and Back cannot reopen private screens; close/reopen after sign-out preserves signed-out state. Together with 54 passing automated tests, static checks, Android export, and the native APK build, this completes task 1.5 and Phase 1. Additional browser-interruption, network/revocation, and full device-matrix checks remain release-hardening coverage, not claimed as completed physical-phone tests here.

**Phase 1 Completion Criteria**

- [x] App launches successfully on Android.
- [x] Navigation works.
- [x] Light and dark themes work.
- [x] Google sign-in and sign-out work.
- [x] Protected screens require authentication.
- [x] Convex connection is functional.

**Deliverable:** Authenticated Joti application shell.

---

## Phase 2 — Companies & Projects

**Goal:** Allow users to organize work history by employer and project.

**Dependency:** Phase 1.

### 2.1 Database Schema

- [x] Define company and project tables.
- [x] Add ownership fields and appropriate indexes.
- [x] Define schema and argument validators.
- [x] Establish shared authorization helpers.
- [x] Implement relationship validation.

### 2.2 Company Management

- [x] Create company query and mutation functions.
- [x] Implement Create Company form.
- [x] Implement company listing.
- [x] Implement company detail view.
- [x] Implement Edit Company.
- [x] Support job title and employment dates.
- [x] Validate required fields and date ranges.
- [x] Prevent deletion when related records exist.
- [x] Implement empty, loading, and error states.

Implemented and deployed to the development backend. Deletion rejects named projects, including archived ones. Task 2.4 adds explicit empty-parent cleanup of the built-in category in the same transaction as company deletion. The entries table is not defined yet; extending the guard to all entries, including General / Adhoc work, drafts, and Trash, is required in task 3.1 before entry creation is enabled. Automated verification is complete; physical-phone layout, keyboard, and authenticated CRUD acceptance remain for the user to review.

### 2.3 Project Management

- [x] Create project query and mutation functions.
- [x] Implement Create Project form.
- [x] Implement projects under each company.
- [x] Implement project detail view.
- [x] Implement Edit Project.
- [x] Support Active and Archived statuses.
- [x] Prevent deleting projects containing entries.
- [x] Handle archived projects correctly.

Implemented and deployed to development. Company details contain paginated project browsing with All/Active/Archived filters. Projects can be created, viewed, edited, archived, and restored; their company is fixed parent context. Permanent project deletion is deliberately unavailable for all projects, so no project or future entry relationship can be deleted through this API. Before exposing deletion later, add checks for all entries, including drafts and Trash. Entry-backed preservation cannot be physically exercised before the entry schema exists. Task 2.4 General / Adhoc provisioning and physical-phone acceptance remain separate work.

### 2.4 General / Adhoc Work

- [x] Establish a built-in General / Adhoc category per company.
- [x] Prevent duplicate General / Adhoc categories.
- [x] Prevent accidental removal of the built-in category.
- [x] Make General / Adhoc selectable during entry creation.

Implemented and deployed; existing development companies are backfilled and audited. New companies provision General / Adhoc atomically. The owned, canonical category is reused on retries, cannot be edited/archived/deleted independently, and is pinned in company All/Active views. Confirmed deletion of an otherwise empty company removes its built-in category with the parent; future entry guards must protect all saved work before Phase 3 writes are enabled. Add Entry includes company/category selection with General as the default actual ID; the full guided form, drafts, and entry persistence remain Phase 3. Task 2.5 and physical-phone acceptance are not claimed complete.

### 2.5 Security & Verification

- [x] Test company ownership checks.
- [x] Test project ownership checks.
- [x] Prevent cross-user record access.
- [x] Validate company/project relationships.
- [x] Verify CRUD and archive workflows.

**Phase 2 Completion Criteria**

- [x] Users can manage multiple companies.
- [x] Companies can contain multiple projects.
- [x] General / Adhoc is available for each company.
- [x] Archived projects preserve their records.
- [x] Users cannot access other users' records.

Verified through automated backend/navigation tests and user-confirmed physical-phone acceptance on 2026-11-25. Archive preservation currently covers project records and relationships, since saved entries arrive in Phase 3.

**Deliverable:** Functional company and project organization.

---

## Phase 3 — Core Journal & Autosave

**Goal:** Implement Joti's primary journaling experience.

**Dependency:** Phase 2.

### 3.1 Entry Data Model

- [x] Define journal entry schema.
- [x] Define Draft and Completed statuses.
- [x] Define Technical, Business, and People impact categories.
- [x] Define Pending, Known, and Not Measurable impact statuses.
- [x] Add optional impact metrics.
- [x] Add entry ownership and relationship validation.
- [x] Extend company deletion guards to all entries, including General / Adhoc work, drafts, and Trash, before enabling entry creation.
- [x] Require entry dependency checks, including drafts and Trash, before exposing any permanent project deletion.
- [x] Establish entry indexes.
- [x] Add revision tracking for concurrency protection.

Schema and backend helpers are deployed to development. Task 3.1 introduced no entry CRUD endpoint or form saving; task 3.2 now applies content/completion validation, archived-project selection rules, server-owned metadata, and revision checks to the entry endpoints.

### 3.2 Entry Backend

- [x] Implement entry creation.
- [x] Implement entry retrieval.
- [x] Implement entry updates.
- [x] Implement draft retrieval.
- [x] Implement manual completion.
- [x] Validate completed entries separately from drafts.
- [x] Prevent invalid company/project relationships.
- [x] Prevent stale updates from overwriting newer revisions.

### 3.3 Guided Entry Form

Use React Hook Form and Zod.

**Step 1 — Task Details**

- [x] Date selection.
- [x] Company selection.
- [x] Project / General Adhoc selection.
- [x] Task title.
- [x] What I Did description.

**Step 2 — Impact**

- [x] Who It Helped.
- [x] Impact category selection.
- [x] Company Impact description.
- [x] Impact status selection.
- [x] Optional impact metrics.

**Step 3 — Notes & Evidence**

- [x] Notes and Praise field.
- [x] Attachment section placeholder.
- [x] Entry review.
- [x] Mark as Completed action.

**Shared Form Behavior**

- [x] Add step progress indicator.
- [x] Support Previous and Next navigation.
- [x] Preserve values between steps.
- [x] Display field-specific validation errors.
- [x] Support editing existing entries.
- [x] Handle incomplete drafts.

Image upload functionality is implemented in Phase 4.

### 3.4 Debounced Autosave

- [x] Create and persist drafts automatically.
- [x] Implement debounced field updates.
- [x] Avoid writes when values have not changed.
- [x] Display Saving, Saved, and Save Failed states.
- [x] Implement manual Retry.
- [x] Add server-checked revision protection.
- [x] Handle conflicting or outdated updates.
- [x] Warn when leaving with unsaved changes.
- [x] Restore previously saved drafts.
- [x] Implement Discard Draft action.
- [x] Prevent duplicate draft creation.

### 3.5 Entry Management

- [x] Build entry detail screen.
- [x] Implement editing.
- [x] Implement manual completion.
- [x] Distinguish entry status from impact status.
- [x] Display related company and project.
- [x] Provide appropriate success and error feedback.

### 3.6 Testing

- [x] Test draft creation.
- [x] Test partial form submissions.
- [x] Test completed-entry validation.
- [x] Test autosave debounce behavior.
- [x] Test network failure and retry.
- [x] Test concurrent/stale updates.
- [x] Test reopening drafts.
- [x] Test backend authorization.

**Phase 3 Completion Criteria**

- [x] Users can create complete journal entries.
- [x] Users can save and resume drafts.
- [x] Autosave works without unnecessary writes.
- [x] Save failures are visible and retryable.
- [x] Stale updates cannot silently overwrite newer content.
- [x] Entries remain private.

Implementation and automated acceptance are complete. Physical-phone acceptance remains user-run and pending; Phase 2's phone report does not establish Phase 3 device acceptance.

**Deliverable:** Fully functional core work journal.

---

## Phase 4 — Dashboard, History & Attachments

**Goal:** Make recorded work easy to find, review, and support with evidence.

**Dependency:** Phase 3.

### 4.1 Dashboard

- [ ] Display recent entries.
- [ ] Display total completed entries.
- [ ] Display unfinished drafts.
- [ ] Show current or recently used company/project.
- [ ] Add Create Entry quick action.
- [ ] Implement empty and loading states.

Avoid advanced analytics.

### 4.2 Work History

- [ ] Build chronological timeline.
- [ ] Implement paginated entry queries.
- [ ] Add company-based browsing.
- [ ] Add project-based browsing.
- [ ] Implement task title and description search.
- [ ] Implement company filter.
- [ ] Implement project filter.
- [ ] Implement date-range filter.
- [ ] Implement impact category filter.
- [ ] Implement entry status filter.
- [ ] Support combined filters.
- [ ] Verify index and search performance.

### 4.3 Image Attachments

- [ ] Define attachment data model.
- [ ] Implement authorized upload workflow.
- [ ] Support image selection from device.
- [ ] Validate supported image formats.
- [ ] Enforce 5 MB maximum per image.
- [ ] Associate uploads with owned entries.
- [ ] Implement private image retrieval.
- [ ] Implement attachment preview.
- [ ] Allow attachment removal.
- [ ] Display company-data privacy reminder.
- [ ] Handle failed and canceled uploads.
- [ ] Implement orphan upload cleanup.

### 4.4 Testing

- [ ] Test timeline pagination.
- [ ] Test search and filter combinations.
- [ ] Test attachment size/type restrictions.
- [ ] Test private attachment authorization.
- [ ] Test orphan cleanup.
- [ ] Test dashboard accuracy.

**Phase 4 Completion Criteria**

- [ ] Users can locate previous accomplishments.
- [ ] Search and filters work correctly.
- [ ] Dashboard shows accurate information.
- [ ] Images can be uploaded and viewed securely.
- [ ] Unauthorized users cannot access private attachments.

**Deliverable:** Searchable journal with supporting evidence.

---

## Phase 5 — Data Management

**Goal:** Protect work history against accidental deletion and support data portability.

**Dependency:** Phase 4.

### 5.1 Trash & Recovery

- [ ] Implement soft deletion using `deletedAt`.
- [ ] Exclude deleted records from normal views.
- [ ] Build Trash screen.
- [ ] Implement entry restoration.
- [ ] Implement 30-day retention policy.
- [ ] Configure scheduled cleanup.
- [ ] Permanently delete expired entries.
- [ ] Delete associated attachments after retention expires.
- [ ] Prevent restoration into invalid relationships.
- [ ] Confirm destructive actions.

### 5.2 CSV Export

- [ ] Implement authorized entry export.
- [ ] Include company and project names.
- [ ] Include work descriptions, impacts, and notes.
- [ ] Support appropriate date formatting.
- [ ] Safely escape commas, quotes, newlines, and formula-like values.
- [ ] Generate Excel/Google Sheets-compatible CSV.
- [ ] Implement Android download/share flow.
- [ ] Handle empty exports and failures.
- [ ] Verify that other users' data cannot be exported.

### 5.3 Session Management

- [ ] Finalize inactivity timeout requirements.
- [ ] Implement automatic sign-out after inactivity.
- [ ] Handle expired sessions gracefully.
- [ ] Protect in-progress form state during session expiration where possible.
- [ ] Verify sign-in is required after expiration.

### 5.4 Testing

- [ ] Test soft deletion and restoration.
- [ ] Test expiration boundaries.
- [ ] Test attachment cleanup after permanent deletion.
- [ ] Test CSV content and security.
- [ ] Test session expiration behavior.

**Phase 5 Completion Criteria**

- [ ] Deleted entries remain recoverable for 30 days.
- [ ] Expired entries and attachments are cleaned up.
- [ ] CSV export works correctly.
- [ ] Inactivity session requirements are enforced.

**Deliverable:** Reliable data management and export.

---

## Phase 6 — Testing & Release Readiness

**Goal:** Validate the complete MVP before personal use or wider distribution.

**Dependency:** Phases 1–5.

### 6.1 Code Quality

- [ ] Run TypeScript checks.
- [ ] Run ESLint.
- [ ] Run formatting checks.
- [ ] Remove unused code and dependencies.
- [ ] Review unnecessary abstractions.
- [ ] Verify consistent coding conventions.

### 6.2 Functional Testing

- [ ] Test authentication lifecycle.
- [ ] Test company/project CRUD.
- [ ] Test the three-step journal form.
- [ ] Test autosave failures and retries.
- [ ] Test draft restoration.
- [ ] Test search and filters.
- [ ] Test image attachments.
- [ ] Test Trash and CSV export.
- [ ] Test light and dark themes.
- [ ] Test Android keyboard and screen layouts.

### 6.3 Security Review

- [ ] Verify authorization on every protected backend operation.
- [ ] Test cross-user access attempts.
- [ ] Validate relationship and ownership checks.
- [ ] Verify private attachment delivery.
- [ ] Confirm sensitive content is not logged.
- [ ] Verify secure session storage and expiration.
- [ ] Validate CSV escaping and export privacy.

### 6.4 Reliability Review

- [ ] Verify errors display actionable messages.
- [ ] Test temporary network interruptions.
- [ ] Test autosave concurrency.
- [ ] Test navigation with unsaved changes.
- [ ] Test duplicate request handling.
- [ ] Test scheduled cleanup behavior.
- [ ] Review loading and empty states.

### 6.5 Android Build

- [ ] Configure application identifiers and metadata.
- [ ] Configure app name and icon.
- [ ] Configure production environment.
- [ ] Create Android release build.
- [ ] Install and test on a physical Android device.
- [ ] Verify Google OAuth in the release build.
- [ ] Verify Convex connectivity.
- [ ] Confirm all MVP acceptance criteria.

**Phase 6 Completion Criteria**

- [ ] All critical flows work on Android.
- [ ] No known critical security or data-loss issues remain.
- [ ] Required checks and tests pass.
- [ ] Release build installs and launches successfully.
- [ ] MVP is ready for personal use.

**Deliverable:** Release-ready Joti Android MVP.

---

## 2. Deferred Features

Do not implement these unless the PRD is updated:

- [ ] AI-assisted writing.
- [ ] AI-generated summaries.
- [ ] Resume generation.
- [ ] PDF reports.
- [ ] Advanced analytics.
- [ ] Calendar browsing.
- [ ] Notifications and reminders.
- [ ] Full offline synchronization.
- [ ] Team collaboration.
- [ ] Public sharing.
- [ ] Web and iOS support.
- [ ] Full backup and restoration.

These are future ideas, not active development tasks.

---

## 3. Blockers & Decisions

Track unresolved issues here.

| Date       | Issue / Decision                                      | Status   | Resolution                                                                                   |
| ---------- | ----------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------- |
| —          | Expo Android + Convex Auth Google OAuth compatibility | Pending  | Validate in Phase 1                                                                          |
| 2026-11-24 | UI tokens and responsive behavior                     | Accepted | Website reference adapted; automated checks pass; user approved current Expo Go phone review |
| —          | Inactivity timeout duration                           | Pending  | Define before Phase 5                                                                        |
| —          | Authorized private attachment delivery                | Pending  | Design before Phase 4                                                                        |

Add new blockers only when they affect implementation.

---

## 4. Progress Log

Update after completing meaningful tasks or milestones.

### 2026-11-26 — Phase 3 commit checkpoint

**Scope:** User requested committing and pushing all Phase 3 work and subsequent form, keyboard, drawer, selection-spacing, status-badge, project-entry browsing, and pagination refinements. Final labels are Project/Choose project, Complete, Discard, and full-width Load More; entry editors have one save-status badge and detail has one Draft/Completed badge with impact status in the body. Entry pages fetch five records initially and three per additional request.

**Verification:** Final `npm run check`, all 265 tests in 28 suites, Android bundle export, live connectivity/anonymous authorization checks, and Git whitespace checks passed. Development backend changes were deployed earlier; test journal records were in-memory only. Theme/token files are unchanged. Phase 3 physical-phone acceptance, including the corrected keyboard and selected-row spacing, has not been confirmed complete; source-control publication does not establish device acceptance. No emulator or phone was launched by the agent.

### 2026-11-26 — Smaller entry pages

**Changed:** The shared EntryList requests five entries on its initial page and three additional entries per Load more tap. This applies to Adhoc/project detail, all entries, and drafts. Existing cursor pagination fetches additional records from the backend rather than merely revealing already loaded rows. The button appears only while more results are available; the loading state retains fetched rows. Company/project option paging is unchanged.

### 2026-11-26 — App-wide selected/pressed row spacing audit

**User report:** Selected styling still appeared without inline padding after the earlier drawer-only utility change. The drawer row already contained px-4 in source; this alone did not establish the on-device appearance. Other company/project/action rows had no side inset at all.

**Changed:** Applied a shared native 16-point horizontal inset to drawer options, selection/date controls, company/project/entry rows, project actions, and project-status filters. Labeled Buttons enforce the same inset for impact controls, entry filters, theme choices, and other actions while preserving caller style overrides and icon-only geometry. Drawer content explicitly retains its native 20-point gutter. Tab buttons have native 8-point side insets within the existing pill. Selected/unselected drawer tests now check resolved native padding, and tab navigation tests check the tab inset. Preserved existing tokens, themes, selection semantics, and reduced-motion behavior. Physical-phone appearance still requires user verification; no reinstall is needed.

**Verification:** All 265 tests in 28 suites, `npm run check`, and Android bundle export passed. Native padding assertions cover selected and unselected drawer rows and tab controls; no device screenshot or agent phone inspection was performed.

### 2026-11-26 — Show entries inside Adhoc and project details

**User report / cause:** Saved test entries could not be seen from General / Adhoc because project detail had no entry list attached. Phase 3's existing journal destination remained available from Home → Open entries and drafts; no live records were inspected or modified to diagnose this missing view.

**Changed:** Added an Entries section to General / Adhoc and named project details using a reusable, reactive, paginated EntryList. Completed rows open entry detail, and drafts resume the editor. Entry detail Back preserves the previous navigation context. The backend list accepts an optional project ID, validates ownership of the project and its company, and applies the owner/project/deletedAt index before pagination. Optional draft filtering also runs before pagination. Archived project history stays readable; Trash and other projects/users are excluded. Reviewed the organization reference sheet and preserved existing themes/tokens. This is a focused project-detail follow-up; the full Phase 4 dashboard/history/search work remains deferred.

### 2026-11-26 — Header status badges and page loading

**Changed:** Entry detail Edit Entry/Resume draft is full width. Removed the completion-success sentence and moved entry/impact statuses into right-aligned header badges. Entry editor save/entry statuses and project detail status use the same shared badge component and semantic theme colors. Complete (formerly Mark completed) now stays visible and disabled during work; ScreenFrame shows a page-level loading indicator for explicit entry actions. Ordinary autosave remains nonblocking and uses its header badge. Existing request locks, backend confirmation, failure/retry behavior, and field status controls are preserved. Phone appearance and loading transitions remain user-run checks; no reinstall is needed.

### 2026-11-26 — Keyboard overlap correction after phone feedback

**User report:** The initial keyboard-aware ScreenFrame change still allowed fields to be covered on the phone; its automated regression checks did not establish actual device keyboard correctness.

**Correction:** FormField now registers each native input directly through a shared keyboard context, rather than relying on focus propagation through ScrollView. ScreenFrame measures the focused input and viewport against the keyboard's reported top edge, scrolls only when the field is obscured, and adds only any remaining viewport/keyboard overlap as scrollable space. This supports both already-resized viewports and overlay keyboards without adding keyboard height twice. Blur checks preserve a newly focused field; pending native callbacks are ignored after unmount or focus changes. Form refs and existing focus/blur handlers are preserved. No new native dependency or rebuild is needed. Actual phone acceptance remains pending.

### 2026-11-26 — Keyboard-aware forms

**Changed:** Shared ScreenFrame now adjusts its available height/padding for the keyboard and reveals the focused text input after keyboard presentation, focus changes, viewport resize, and content growth. This covers company, project, and entry forms, including multiline fields. Pending frame callbacks/listeners are cleaned up on unmount. Preserved scrolling, handled taps, safe areas, and the header; disabled duplicate automatic iOS keyboard insets. The installed Android manifest already uses adjustResize, so no native config or dependency change/reinstall is required. Actual keyboard geometry, long multiline editing, switching fields, and dismissal remain physical-phone checks.

### 2026-11-26 — Entry save status in header

**Changed:** Moved entry autosave status into the right-hand header action area, removing its standalone body row. Preserved live status announcements and all autosave behavior; detailed errors, offline feedback, Retry, and conflict controls remain in the form area. Themes and design tokens are unchanged.

### 2026-11-26 — Independent selection-sheet motion

**Follow-up:** Selection drawers now occupy at least half the current screen even with one option, while retaining the 90% maximum and internal scrolling for longer lists.

**Changed:** Company/category choice sheets now use a stationary fading backdrop and independently translated drawer instead of sliding the entire transparent native Modal. The backdrop uses existing dark-valued theme colors, avoiding the white wash produced by dark-mode foreground. Entrance animations use the native driver, stop on interruption/unmount, and honor reduced motion. Selection, backdrop dismissal, Android Back, and the Close action remain immediate. All shared ChoiceSheet consumers inherit the fix; the separate project archive sheet is unchanged. Native phone appearance remains user-run; no rebuild is required.

### 2026-11-26 — Inline date clearing

**Changed:** All shared date inputs (entry work date and company employment dates) show a calendar icon when empty and an inline X after selection. X clears the value without opening the calendar; tapping the date text still changes it through the picker. Removed the separate visible Clear control. Preserved disabled states, accessible clear-action labels, touch targets, validation, and existing theme tokens. No native rebuild is required; phone appearance remains user-run.

### 2026-11-26 — Entry form label and action refinement

**Follow-up:** Removed the top Draft/Step caption and reduced entry-form/organization-field spacing from 24 to 16 points to show more fields in the viewport. Retained accessible step navigation and scrolling for keyboard, longer content, and large text. Physical fit remains user-verified on the phone.

**Changed:** Removed the idle “Choose a company to start a draft” sentence and its empty spacing. Required entry fields now use danger-colored asterisks, with explanatory required/optional labels removed. Discard is text-only, uses the existing danger token at a light tint and shared pill radius, and shares the navigation action row with Next (or the final completion action). Previous remains available on later steps. Backend validation, autosave, and confirmation behavior are unchanged. Phone appearance review remains user-run; no native rebuild is needed.

**Verification:** `npm run check` and all 22 relevant form, management, calendar, and organization-selector tests passed. Existing discard-confirmation tests now distinguish the footer Discard from the confirmation-sheet action.

### 2026-11-25 — Phase 3.2 entry backend

**Completed:** Deployed authenticated creation, private retrieval, paginated entry/draft retrieval, full-content updates, explicit completion, and draft discard. Shared Zod validation supports incomplete drafts and requires real dates, titles, and work descriptions for completion and subsequent completed-entry edits. Limits, unique impact categories, server metadata, owner/parent validation, and expected revisions are enforced on the backend. Archived projects cannot receive new entries or newly reassigned work; existing archived relationships remain editable. Creation keys are indexed per user; write IDs allow exact last-write retries after a lost response without another revision/write. Unchanged saves are no-ops. Discard soft-deletes drafts, leaving company/project guards intact. No permanent deletion endpoint was added.

**Verification:** Backend tests cover partial content, required completion fields, authorization, validation, idempotency, optionals clearing, no-op writes, competing/stale writes, archived relationships, and Trash retention. An additional real Auth component runtime test completes an entry, rejects another user's access, then confirms session revocation immediately denies access. No live journal test content was created.

### 2026-11-25 — Phase 3.3 guided entry form

**Reviewed:** Visually inspected `entry-flow-sheet-v1.png` and `edit-and-confirmation-sheet-v1.png`, plus the reference index and main screen flow. Preserved all theme/token files.

**Completed:** Replaced temporary Add Entry setup with the three-step React Hook Form/Zod form: calendar and company/category, title/work description, beneficiaries, multiple impact categories, independent impact status, optional metrics, notes, attachment placeholder, review, and explicit completion. Steps retain values, expose accessible progress/navigation, and use brief interruption-safe fades honoring reduced motion. Completion errors return to the appropriate fields. Real company/category labels appear in review. Existing archived project selections are preserved when editing. Attachments remain unavailable rather than simulated.

**Verification:** Form tests cover cross-step values, completion errors, restoration, and explicit valid completion. Existing selector/calendar tests and an added archived-selection regression remain part of the full suite. Physical layout/keyboard/large-text appearance remains pending user phone review.

### 2026-11-25 — Phase 3.4 debounced autosave

**Completed:** Added a 700 ms serialized save queue with one acknowledged revision, debounced creation/update, normalization-based change detection, retryable exact requests, and per-editor creation keys. Changes made during a save are queued after acknowledgment. Offline/failed writes retain local text and never display Saved. Stale writes require explicit reload confirmation; no force overwrite is offered. Completion flushes current content before the backend validates it, including edits made after a failed completion attempt. A recovered creation response already changed by another client triggers conflict. Navigation warns about unsaved or in-flight work, and unmount cancels pending debounce callbacks. Confirmed discard moves a saved draft to Trash; cancellation retains it. Trash recovery UI remains Phase 5.

**Verification:** Thirteen queue tests cover debounce, no-op changes, serialization, lost responses, offline retry, conflicts, completion/latest values, invalid fields (including before organization selection), discard, and unmount/late responses. UI tests verify retained text and retry requests. A real router flow selects General and autosaves one draft before leaving.

### 2026-11-25 — Phase 3.5 entry management

**Completed:** Added protected entry detail/edit routes and a paginated Entries/Drafts destination linked from Home. Draft rows resume their saved form; completed rows open detail with real company/project, work, impact, and notes. Edit preserves saved values and completed-entry validation. Completion feedback appears only after backend confirmation; entry status and impact status are shown independently. Loading, unavailable/Trash, empty, failure/retry, and preview isolation states are explicit. The full dashboard, search/history filters, image uploads, and Trash recovery remain their later phases.

**Verification:** Seven management tests cover detail data, draft navigation, restoration, autosave, failed-save retry, backend-confirmed completion, cancel/confirm discard, and preview isolation. Protected entry/list/edit deep links are included in real router guard tests.

### 2026-11-25 — Phase 3.6 final verification

**Verification:** All 255 tests in 25 suites, `npm run check`, Android production bundle export, development deployment/code generation, and the extended live `npm run convex:check` passed. The live probe verifies anonymous entry-list rejection in addition to existing user/company probes. Backend entry workflows and two-user/revocation scenarios were tested in-memory; no synthetic private records were written to the live deployment. In-memory competing-save tests do not establish production concurrency/load characteristics. No emulator, Android launch, or manual preview server was started by the agent.

**Phone acceptance pending:** In the existing calendar-enabled physical-phone development build, run `npm run start:dev`; no native dependency was added and no reinstall is required. Create an incomplete draft, pause and confirm Saved as draft, leave/reopen through Home → Open entries and drafts, and verify all three steps retain values. Check completion errors, valid completion/detail, editing completed records, independent impact status, and existing archived-project history. Disconnect and type: failed/unsaved state must retain text and Retry must save once after reconnecting. Check leaving with unsaved work, discard cancellation/confirmation, separate-account privacy, light/dark themes, keyboard scrolling/Save reachability, large text, and reduced motion. Where possible, edit the same draft in two sessions to check the conflict/reload warning. Draft discard is retained but Trash recovery is not yet exposed; entry attachments remain unavailable.

**Next:** Task 4.1 — Dashboard (not started). Phase 3 phone acceptance remains user-run and is separate from the user-authorized commit/push.

### 2026-11-25 — Phase 3.1 entry data model

**Completed:** Added `entries` with native owner/company/project IDs, optional draft journal fields, independent Draft/Completed and impact statuses, multiple impact categories, optional free-text metrics, notes, timestamps, Trash metadata, and server-managed revision foundation. Six indexes cover owner/date history, active drafts, company/project history, and unfiltered company/project dependency checks. Added ordinary private helpers for owned entry/parent resolution, dependency guards, and safe revision advancement from revision 1. Company removal now blocks all related entries before General cleanup, and also checks General's project ID independently to fail closed on mismatched company references. Permanent project deletion remains unavailable; any future implementation must use the project dependency guard in the same authorized transaction.

**Verification:** `npm run check` passed and all 215 tests in 21 suites passed. Thirty new model tests cover incomplete drafts, optional metrics, valid/invalid status/category shapes, private ownership and relationships, archived/Trash history, active/completed/deleted General dependencies, corrupt references, indexed isolation, invalid/exhausted revisions, and stale-save rejection inside a test transaction. Development deployment succeeded with all six entry indexes and regenerated Convex API types; `npm run convex:check` passed afterward. Test entry writes were in-memory only; no live journal content was created or printed.

**Scope:** Stopped at 3.1. The schema validates field types and enum values; real calendar dates, content limits, category uniqueness, required completion fields, and lifecycle-specific write rules remain task 3.2. Revision helpers establish the contract but do not replace endpoint enforcement in that task. Existing company/project behavior remains covered by the full regression suite. No application screens, design tokens, themes, or native dependencies changed. No new phone acceptance or reinstall is needed for this backend-only task; no Android launch or manual preview server was started. Android bundle export was not repeated because no client bundle code changed.

**Next:** Task 3.2 — Entry Backend. Use the ownership/relationship helpers before reading or writing, derive metadata on the server, enforce Draft versus Completed requirements, and apply expected-revision checks in the same mutation as each update/completion.

### 2026-11-25 — Phase 2 physical-phone acceptance

**User-confirmed:** The user confirmed that all eight manual checklist areas passed on their phone: multiple-company CRUD and date validation; cancelled/confirmed empty-company deletion and named/archived-project deletion protection; project creation/editing with fixed company relationships; archive cancellation, filtering, and restoration; one read-only General / Adhoc per company and correct Add Entry company/category selection; signed-out route protection and isolation between two Google accounts; offline feedback and retry without duplicate records; and approved design composition, themes, keyboard/Save reachability, calendars, circular company actions, enlarged text, and reduced motion.

**Evidence:** This is the user's device acceptance report, distinct from agent-run automated checks. No screenshots or independent agent device inspection were collected. Earlier pending phone notes below describe the state at each implementation milestone and are superseded by this acceptance for Phase 2 behavior. Journal saving, entry-backed archive preservation, drafts, and Trash remain outside Phase 2.

**Next:** Commit and push the completed Phase 2 work, then task 3.1 — Entry Data Model.

### 2026-11-25 — Phase 2.5 security and verification

**Reviewed:** Company/project public validators and ownership enforcement, parent relationships, authenticated session resolution, indexed lists, General provisioning, deletion guards, and archive/restore. No production security correction was needed. No UI, theme, or token changes were made; the existing approved design references remain in force.

**Completed:** Added `convex-test` as a development dependency under the existing Jest Expo runner. Seventeen registered-function tests exercise real argument/schema validation, indexes, transactions, and the installed Auth component's actual session lookup. Test-only fixture mutations seed/revoke sessions exclusively in memory; they are not deployed or included in the application. The suite covers anonymous and cross-user access, forged user IDs used as session subjects, session revocation, protected-field overposting, malformed/wrong-table IDs, owner/company/status pagination, normalized CRUD and invalid writes, archive/restore identity preservation, archived-child deletion guards, General retry/read-only/parent cleanup, broken/foreign parents, foreign-owned child corruption, and company/General transaction rollback after an injected failure.

**Verification:** `npm run check`, all 185 tests in 20 suites, Android production bundle export, and `npm run convex:check` passed. The live probe checks connectivity and anonymous user/company rejection; two-user authorization and session-revocation evidence comes from the in-memory runtime rather than live Google sign-ins. JWT signature verification, deployed transaction concurrency, and phone acceptance are not established by that runtime. Existing development backfill/audit results are recorded under task 2.4; no private live records were modified for this task.

**Phone review:** Subsequently confirmed passed by the user on 2026-11-25; see the Phase 2 physical-phone acceptance entry above. No emulator, Android launch, or manual preview server was started by the agent.

**Next:** Task 3.1 — Entry Data Model (not started). Before enabling any entry writes, company deletion must check all saved entries, including General / Adhoc, drafts, and Trash. Any future permanent project deletion also requires an entry dependency guard. Entry-backed archive preservation remains a Phase 3 check.

### 2026-11-25 — Phase 2.4 General / Adhoc work

**Reviewed:** Organization and empty-company/project references plus the company/category fields in the first-use sheet. Existing themes/tokens and the current task boundary remain authoritative.

**Completed:** Added one transactional General / Adhoc provisioning helper, atomic company/category creation, authenticated idempotent setup and lookup, reserved-name validation, and bounded admin-only backfill/audit functions. Preserved existing IDs during canonical built-in repair and ordinary legacy records during migration. Existing built-in edit/archive restrictions and the absence of standalone project deletion protect the category. Empty-company deletion now checks named projects and removes only its owned built-in category with the parent. Company details pin General independently of named-project pagination and show the no-named-projects state. Add Entry now provides real company/category selection, defaults to that company's General ID, clears stale relationships on company switches, and excludes archived named projects. Choice sheets honor reduced motion; preview accesses no private data. Entry fields and saving remain explicitly unavailable rather than simulated.

**Verification:** Convex code generation, `npm run check`, all 168 tests in 19 suites, and Android production bundle export passed. Tests cover per-company idempotency, ownership, canonical repair, reserved names, duplicate failure, restartable/paginated migration, empty-parent cleanup, named-project deletion guards, built-in read-only routes, category selection/reselection, company switching, stale archived/deleted choices, offline/setup retries, late failures, preview isolation, and real router selection flows. Development deployment succeeded. Two concurrent real backfill calls each processed the existing company; a full audit checked one company and found zero missing, duplicate, or invalid built-in categories. Only counts were logged; no company/journal content was printed. Theme/token files are unchanged.

**Phone review:** Not performed by the agent. Use `npm run start:dev` in the installed calendar-enabled development build. Verify General appears once in an existing and a newly created company, remains read-only, and is selected by default after choosing a company in Add Entry. Switch to another company, choose a named project and General again, and inspect enlarged text, themes, and reduced-motion sheets. Confirm that selection is temporary and that journal saving is not offered yet. Task 2.4 adds no native dependency, so no additional install is needed if the earlier calendar build is installed. No emulator, Android launch, or manual preview server was started.

**Scope:** Stopped at 2.4. Task 2.5 remains not started. The Phase 3 company deletion guard must include entries associated with General / Adhoc before any entry writes are enabled. Full entry creation, autosave, and actual saved-entry acceptance remain Phase 3.

**Next:** Task 2.5 — Security & Verification.

### 2026-11-25 — Phase 2.3 project management

**Reviewed:** Organization, empty/edit-project, and archive-confirmation references in `docs/designs/supporting-screens/`, following the main flow and existing themes/tokens.

**Completed:** Added owner- and company-scoped paginated project queries, private project/company detail, and authorized create/update/status mutations. New projects are Active and server-owned with `isGeneral: false`; names/descriptions are trimmed and validated independently on both client and server. Editing replaces editable fields and clears blank descriptions while preserving parent company, ownership, creation metadata, and built-in flags. Added project browsing beneath company details, status filters, protected add/detail/edit routes, full-screen forms, explicit status editing, and reduced-motion-aware archive/restore confirmation sheets with retry/loading/offline feedback. Archive/restore changes only status/timestamps; all project deletion stays unavailable. Reused the company frame, feedback, error boundary, and request-error handler as shared UI primitives without altering company title-row actions or theme tokens.

**Verification:** Convex code generation, local route generation without a preview server, `npm run check`, all 144 tests across 18 suites, and Android production bundle export passed. New coverage includes project authorization across every endpoint, foreign/missing parent relationships, owner/company/status filtering before pagination, validation, metadata protection, optional-description clearing, idempotent archiving, archive/restore preservation, built-in flags, UI empty/loading/error/retry/offline states, duplicate saves, preview isolation, protected project deep links, and a real-router company → add project → detail → edit → archive → filtered list → restore flow. `npm run convex:push` deployed the implementation; the existing live health/anonymous user-company authorization smoke check passed. Project-specific authorization is covered by automated handler tests, not claimed as physical cross-account acceptance.

**Phone review:** Not performed by the agent. Use `npm run start:dev` with the installed Joti development build. From Companies, open a company, add/edit a project, archive it, find it via the Archived filter, and restore it. Review keyboard/scroll behavior, large text, themes, and reduced-motion confirmation sheets. Task 2.3 adds no native dependencies, so no additional rebuild is needed if the earlier calendar-enabled development build is already installed. Expo Go cannot exercise authenticated project workflows. No emulator, Android launch, or manual preview server was started.

**Scope:** Stopped at 2.3. Company reassignment and permanent project deletion are unavailable. No General / Adhoc provisioning, entries, fake entry counts, or entry-backed archive acceptance was introduced. Task 2.4 remains not started.

**Next:** Task 2.4 — General / Adhoc Work.

### 2026-11-25 — Company title-row actions

**Completed:** Applied the user's refinement to place Edit and Delete at the right of the company-name title row as circular Pencil/Trash icon buttons. Reused the shared Button with an icon-only mode, 48-point targets, accessible labels, and existing theme tokens. Preserved edit navigation, deletion confirmation, loading feedback, and disabled states. Recorded this refinement in `docs/DESIGN_SYSTEM.md`.

**Verification:** Static checks passed; all 20 affected company UI, navigation, and shared design-system tests passed. Theme/token files are unchanged. No new native dependency or device reinstall is required for this refinement; the earlier calendar dependency still requires its documented rebuild if not yet installed. Narrow-screen and enlarged-text visual acceptance remains a phone check.

### 2026-11-25 — Phase 2.2 design-reference alignment

**Reviewed:** The main screen flow, current populated/first-use sheets, supporting screen index, organization sheet, and empty-company reference under `docs/designs/`. These guide composition and interaction; existing app themes and tokens remain authoritative.

**Completed:** Replaced the company placeholder hero/card composition with compact title rows, plain divided company rows with initials and chevrons, a focused Organize-mascot empty state with one Add Company action, and a compact company profile. Create/edit forms now use an open layout, native Android calendar controls with readable dates and Clear actions, and a full-width bottom Save action. Back retains the existing unsaved-change warning. Removed competing Add Entry actions from Companies and Settings, and kept tabs out of company forms. Dates still persist as date-only strings; project/entry sections and counts remain deferred until those features exist. Added permanent every-session reference-reading and pre-UI image-review instructions to `AGENTS.md`, including the requirement to preserve themes/tokens.

**Verification:** `npm run check` passed; all 111 tests in 16 suites passed; Android production bundle export passed. Tests cover calendar selection/cancellation/clearing/failure and disabled controls, local date round-trips, employment summaries, company UI flows, guarded routes, save/discard navigation, and tab action placement. Verified no diff in `constants/design-tokens.js`, `tailwind.config.js`, or `lib/theme.tsx`. No manual preview server, emulator, Android launch, or physical-phone acceptance was performed.

**Phone review required:** The Expo-compatible calendar picker is a new native dependency. Rebuild/install on a connected physical phone with `npm run build:android -- --device`, even if an older Joti development build is installed; later sessions use `npm run start:dev`. Check compact headers, populated/empty Companies, form scrolling and keyboard behavior, calendar selection/cancellation/clearing, full-width Save, light/dark themes, enlarged text, and reduced motion. Expo Go supports only unauthenticated preview, not Google sign-in or real company CRUD. Native compilation and the dialog's on-device appearance remain unverified.

**Scope:** Corrected task 2.2 UI and session instructions only. Task 2.3 remains not started; the previously deployed company backend is unchanged.

### 2026-11-25 — Phase 2.2 company management

**Completed:** Added authenticated, owner-filtered company queries and mutations; reactive pagination; protected create/detail/edit routes; optional job titles and date-only employment values; shared React Hook Form/Zod validation on the client and independent backend enforcement. Added trimmed names, 200-character name/title limits, real-calendar and employment-range checks, clearing optional values on full-form updates, server-owned metadata, transactional project deletion guards, destructive confirmation, unsaved-change warnings, duplicate-submit protection, offline feedback, and error/retry states. Reused semantic theme tokens and brief reduced-motion-aware feedback. Design preview grants no company access. Added the required form dependencies with npm and regenerated API/route types without starting a preview server.

**Verification:** `npm run check` passed; all 103 tests across 14 suites passed; Android production bundle export passed. Coverage includes company CRUD handlers, owner-filtered pagination, signed-out/cross-user access, related project deletion guards (active/archived/built-in), optional-field clearing after Convex serialization, date edge cases, UI loading/empty/error/retry/offline states, duplicate saves, preview isolation, guarded deep links, and actual router create/edit/discard transitions. `npm run convex:push` deployed the implementation to the development backend; the extended live `npm run convex:check` passed and verified anonymous company reads and creation are denied without creating test records.

**Phone review:** Not performed by the agent. Run `npm run start:dev` and open the installed Joti development build to review create/detail/edit/delete, field validation, keyboard behavior, enlarged text, themes, and reduced motion. Expo Go is an unauthenticated design preview and cannot exercise real company CRUD. See `docs/CONVEX_SETUP.md` for the physical-phone build command if needed.

**Scope:** Stopped at 2.2. Project CRUD/browsing, automatic General / Adhoc creation, and entry schemas remain later tasks. Entry dependency checks must be added in 3.1 before enabling entries; the checklist records this prerequisite.

**Next:** Task 2.3 — Project Management (not started).

### 2026-11-25 — Phase 2.1 database schema

**Completed:** Added company/project tables with ownership, optional employment details, project status, the built-in category flag, timestamps, and indexes for owner/company/status/category lookups. Added reusable schema and client-argument validators that exclude server-controlled fields. Reused live-session authorization through company/project helpers, including parent-company ownership and company/project pairing checks. Regenerated Convex types and documented the backend contracts.

**Verification:** Convex code generation and backend typechecking passed. `npm run check` passed (frontend/backend TypeScript, ESLint, Prettier). All 62 tests across 10 suites passed, including eight new authorization/relationship cases covering signed-out access, missing/foreign records and parent companies, cross-user project access, mismatched owned pairs, and archived historical relationships. No phone checks, emulator, or Metro session were needed for this backend-only task.

**Scope:** Stopped at 2.1. CRUD endpoints, forms, semantic name/date validation, automatic General / Adhoc creation and uniqueness, and later-phase journal tables remain unimplemented. On the user's request, `npm run convex:push` successfully deployed the schema to the configured development backend on 2026-11-25.

**Next:** Task 2.2 — Company Management (not started).

### 2026-11-24 — Phase 1.3 design system

**Completed:** Studied the supplied website with search and HTML/CSS retrieval. Added independently sourced Inter fonts, stable NativeWind 4 / Tailwind 3, semantic light/dark palettes, shared tokens and reusable primitives, system/session theme selection, themed navigation/status bars, dotted section backgrounds, compact pill buttons, clipped pill navigation, a fluid active-tab indicator, and native animated Lucide icons. Documented app-wide motion principles and reduced-motion behavior. Prepared the selected original 2D notebook mascot as one combined action sheet and nine separate transparent PNGs with an intended-use map. Applied the design system to the preview screens without implementing later-phase features.

**Verification:** TypeScript, ESLint, formatting, Tailwind compilation, Expo dependency compatibility, 18 tests, and Android production bundle export. Tests cover compiled styles, themes, contrast, disabled/busy semantics, responsive breakpoints, clipped tab layers, icon replay, indicator motion, and reduced-motion behavior. Mascot extraction checks verified dimensions, transparency, and original pixels. No emulator, computer control, or manual-preview server was started for this task.

**Acceptance:** The user completed a phone review in Expo Go, accepted the current design, and explicitly requested marking 1.3 done and committing/pushing the work. Further device-matrix testing and mascot screen integration remain future work.

**Next:** Task 1.4 — Convex Setup (not started).

### 2026-11-23 — Phase 1.1–1.2

**Completed:** Expo SDK 58 / React Native TypeScript foundation; npm lockfile; strict types and `@/` aliases; ESLint and Prettier; agreed folder structure; auth/protected route groups; Home, History, Companies, Settings tabs; Add Entry modal placeholder; startup loading and stack transitions.

**Verification:** Android launch in Expo Go 58.0.5 on Medium_Phone_API_36.1; Android UI hierarchy confirms the shell rendered. Seven Jest Expo / React Native Testing Library integration tests pass, covering startup/deep-link guards, tab navigation, modal return, preview exit/history removal, and production preview exclusion. TypeScript, ESLint, Prettier, Expo dependency checks, and Android production bundle export pass.

**Notes:** npm with Node.js 24 LTS selected. React DOM is pinned to Expo's React version to satisfy Router peer dependencies. Windows emulator UI control was denied; verification used Android runtime/UI hierarchy diagnostics and automated navigation tests. npm reports 22 moderate transitive advisories in the complete dependency tree (three with development dependencies omitted); its proposed automatic fix downgrades Expo and was not applied. No native APK/release build or physical-device testing was performed.

**Next:** Stop at the requested 1.2 boundary. Phase 1.3 requires approved UI reference images/mockups; Convex and Google authentication remain unimplemented.

### Entry Template

**Date:** YYYY-MM-DD  
**Phase:** Phase number  
**Completed:** Brief description  
**Verification:** Tests/checks performed  
**Notes:** Important findings or decisions  
**Next:** Next task

---

## 5. MVP Completion Checklist

Joti's MVP is complete when:

- [ ] All six development phases are complete.
- [ ] All agreed PRD requirements are implemented.
- [ ] All critical flows have been tested.
- [ ] User data and attachments are securely isolated.
- [ ] Autosave and recovery behavior are verified.
- [ ] The Android release build is functional.
- [ ] No critical bugs or security issues remain.

**Development Principle:**

> Build small, verify often, and keep Joti simple.

Each completed milestone should leave the application in a stable, usable state.
