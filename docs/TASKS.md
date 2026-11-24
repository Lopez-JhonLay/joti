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
| 1. Project Foundation      | In Progress |
| 2. Companies & Projects    | Not Started |
| 3. Core Journal & Autosave | Not Started |
| 4. History & Attachments   | Not Started |
| 5. Data Management         | Not Started |
| 6. Testing & Release       | Not Started |

**Current Phase:** Phase 1  
**Current Task:** 1.5 (not started)  
**Overall Status:** In Progress; tasks 1.1–1.4 complete

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

**Scope note:** Route guards currently use an in-memory, development-only navigation preview. No user is authenticated; production builds cannot enter preview. Real Convex Auth state and backend authorization remain in 1.4–1.5. The shared design system is implemented in 1.3.

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

### 1.5 Google Authentication

- [ ] Validate Convex Auth + Google OAuth compatibility with Expo Android.
- [ ] Configure Google OAuth credentials and redirect handling.
- [ ] Implement Google sign-in.
- [ ] Implement secure session persistence.
- [ ] Implement manual sign-out.
- [ ] Protect authenticated application screens.
- [ ] Handle authentication loading and failure states.
- [ ] Verify session persistence after app restart.
- [ ] Document the supported inactivity expiration approach.

**Phase 1 Completion Criteria**

- [x] App launches successfully on Android.
- [x] Navigation works.
- [x] Light and dark themes work.
- [ ] Google sign-in and sign-out work.
- [ ] Protected screens require authentication.
- [ ] Convex connection is functional.

**Deliverable:** Authenticated Joti application shell.

---

## Phase 2 — Companies & Projects

**Goal:** Allow users to organize work history by employer and project.

**Dependency:** Phase 1.

### 2.1 Database Schema

- [ ] Define company and project tables.
- [ ] Add ownership fields and appropriate indexes.
- [ ] Define schema and argument validators.
- [ ] Establish shared authorization helpers.
- [ ] Implement relationship validation.

### 2.2 Company Management

- [ ] Create company query and mutation functions.
- [ ] Implement Create Company form.
- [ ] Implement company listing.
- [ ] Implement company detail view.
- [ ] Implement Edit Company.
- [ ] Support job title and employment dates.
- [ ] Validate required fields and date ranges.
- [ ] Prevent deletion when related records exist.
- [ ] Implement empty, loading, and error states.

### 2.3 Project Management

- [ ] Create project query and mutation functions.
- [ ] Implement Create Project form.
- [ ] Implement projects under each company.
- [ ] Implement project detail view.
- [ ] Implement Edit Project.
- [ ] Support Active and Archived statuses.
- [ ] Prevent deleting projects containing entries.
- [ ] Handle archived projects correctly.

### 2.4 General / Adhoc Work

- [ ] Establish a built-in General / Adhoc category per company.
- [ ] Prevent duplicate General / Adhoc categories.
- [ ] Prevent accidental removal of the built-in category.
- [ ] Make General / Adhoc selectable during entry creation.

### 2.5 Security & Verification

- [ ] Test company ownership checks.
- [ ] Test project ownership checks.
- [ ] Prevent cross-user record access.
- [ ] Validate company/project relationships.
- [ ] Verify CRUD and archive workflows.

**Phase 2 Completion Criteria**

- [ ] Users can manage multiple companies.
- [ ] Companies can contain multiple projects.
- [ ] General / Adhoc is available for each company.
- [ ] Archived projects preserve their records.
- [ ] Users cannot access other users' records.

**Deliverable:** Functional company and project organization.

---

## Phase 3 — Core Journal & Autosave

**Goal:** Implement Joti's primary journaling experience.

**Dependency:** Phase 2.

### 3.1 Entry Data Model

- [ ] Define journal entry schema.
- [ ] Define Draft and Completed statuses.
- [ ] Define Technical, Business, and People impact categories.
- [ ] Define Pending, Known, and Not Measurable impact statuses.
- [ ] Add optional impact metrics.
- [ ] Add entry ownership and relationship validation.
- [ ] Establish entry indexes.
- [ ] Add revision tracking for concurrency protection.

### 3.2 Entry Backend

- [ ] Implement entry creation.
- [ ] Implement entry retrieval.
- [ ] Implement entry updates.
- [ ] Implement draft retrieval.
- [ ] Implement manual completion.
- [ ] Validate completed entries separately from drafts.
- [ ] Prevent invalid company/project relationships.
- [ ] Prevent stale updates from overwriting newer revisions.

### 3.3 Guided Entry Form

Use React Hook Form and Zod.

**Step 1 — Task Details**

- [ ] Date selection.
- [ ] Company selection.
- [ ] Project / General Adhoc selection.
- [ ] Task title.
- [ ] What I Did description.

**Step 2 — Impact**

- [ ] Who It Helped.
- [ ] Impact category selection.
- [ ] Company Impact description.
- [ ] Impact status selection.
- [ ] Optional impact metrics.

**Step 3 — Notes & Evidence**

- [ ] Notes and Praise field.
- [ ] Attachment section placeholder.
- [ ] Entry review.
- [ ] Mark as Completed action.

**Shared Form Behavior**

- [ ] Add step progress indicator.
- [ ] Support Previous and Next navigation.
- [ ] Preserve values between steps.
- [ ] Display field-specific validation errors.
- [ ] Support editing existing entries.
- [ ] Handle incomplete drafts.

Image upload functionality is implemented in Phase 4.

### 3.4 Debounced Autosave

- [ ] Create and persist drafts automatically.
- [ ] Implement debounced field updates.
- [ ] Avoid writes when values have not changed.
- [ ] Display Saving, Saved, and Save Failed states.
- [ ] Implement manual Retry.
- [ ] Add server-checked revision protection.
- [ ] Handle conflicting or outdated updates.
- [ ] Warn when leaving with unsaved changes.
- [ ] Restore previously saved drafts.
- [ ] Implement Discard Draft action.
- [ ] Prevent duplicate draft creation.

### 3.5 Entry Management

- [ ] Build entry detail screen.
- [ ] Implement editing.
- [ ] Implement manual completion.
- [ ] Distinguish entry status from impact status.
- [ ] Display related company and project.
- [ ] Provide appropriate success and error feedback.

### 3.6 Testing

- [ ] Test draft creation.
- [ ] Test partial form submissions.
- [ ] Test completed-entry validation.
- [ ] Test autosave debounce behavior.
- [ ] Test network failure and retry.
- [ ] Test concurrent/stale updates.
- [ ] Test reopening drafts.
- [ ] Test backend authorization.

**Phase 3 Completion Criteria**

- [ ] Users can create complete journal entries.
- [ ] Users can save and resume drafts.
- [ ] Autosave works without unnecessary writes.
- [ ] Save failures are visible and retryable.
- [ ] Stale updates cannot silently overwrite newer content.
- [ ] Entries remain private.

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
