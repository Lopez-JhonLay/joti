# Joti — Product Requirements Document (PRD)

## 1. Product Overview

**Joti** is a private, mobile-first work journal that helps professionals document their accomplishments, contributions, and career growth.

Inspired by the habit of keeping a personal notebook, Joti helps users remember meaningful work, recognize their progress, and maintain an organized professional history.

**Tagline:** Little notes. Big progress.

### Primary Goals

- Make work journaling fast, simple, and reliable.
- Organize work history across companies and projects.
- Record technical, business, and people-related contributions.
- Preserve accomplishments for long-term reference.
- Provide secure and private access to work records.

### Target Users

- **MVP:** Personal use.
- **Future:** Individual professionals documenting their careers.

The architecture must support multiple independent user accounts without introducing collaboration features.

---

## 2. Technology Stack

| Layer              | Technology                 |
| ------------------ | -------------------------- |
| Mobile             | React Native + Expo        |
| Language           | TypeScript                 |
| Styling            | NativeWind                 |
| Backend & Database | Convex                     |
| Authentication     | Convex Auth + Google OAuth |
| File Storage       | Convex File Storage        |
| Initial Platform   | Android                    |

### Technical Principles

- Use TypeScript throughout the application.
- Keep the architecture simple and maintainable.
- Use Convex queries, mutations, and actions appropriately.
- Enforce ownership and authorization on backend operations.
- Avoid unnecessary services and dependencies.
- Support light and dark themes.

**Important:** Validate Convex Auth Google OAuth compatibility with Expo before implementing dependent features.

---

## 3. MVP Features

### 3.1 Authentication

Users authenticate through their Google account.

**Requirements:**

- Google sign-in using Convex Auth.
- Persistent authenticated sessions.
- Automatic sign-out after an inactivity period.
- Manual sign-out.
- Protected application screens.
- User-specific private data.

Session expiration must be enforced securely, not solely through frontend navigation.

### 3.2 Dashboard

The dashboard is the primary landing screen.

**Contents:**

- Recent work entries.
- Total recorded entries.
- Current or recently used company and project.
- Prominent Add Entry action.
- Unfinished drafts.
- Quick access to companies, projects, and history.

Advanced analytics are excluded.

### 3.3 Company Management

Users can manage their employment history.

**Fields:**

- Company name (required).
- Job title.
- Employment start date.
- Employment end date (optional).

**Operations:**

- Create, view, and edit companies.
- Delete companies only when no related projects or entries remain.
- View associated projects and entries.

### 3.4 Project Management

Projects organize work entries within companies.

**Fields:**

- Project name (required).
- Company (required).
- Description (optional).
- Status: Active or Archived.

**Requirements:**

- Create, view, edit, and archive projects.
- Filter projects by company.
- View associated entries.
- Prevent deletion of projects with existing entries.
- Preserve historical entries when archiving.

Each company includes a built-in **General / Adhoc** category for work that does not belong to a specific project.

### 3.5 Work Journal Entries

Users can create, edit, view, and delete entries.

#### Entry Fields

| Field            | Description                     |
| ---------------- | ------------------------------- |
| Date             | Date work was performed         |
| Company          | Associated company              |
| Project          | Project or General / Adhoc      |
| Task             | Short task title                |
| What I Did       | Description of work completed   |
| Who It Helped    | Beneficiaries of the work       |
| Company Impact   | Description of contributions    |
| Impact Category  | Technical, Business, People     |
| Impact Status    | Pending, Known, Not Measurable  |
| Impact Metrics   | Optional measurable results     |
| Notes and Praise | Feedback, recognition, or notes |
| Attachments      | Supporting images               |
| Entry Status     | Draft or Completed              |

Multiple impact categories may be selected.

Drafts may contain incomplete information. Completed entries require a date, company, project/category, task title, and work description.

#### Guided Entry Form

**Step 1 — Task Details**

- Date
- Company
- Project / General Adhoc
- Task title
- What I Did

**Step 2 — Impact**

- Who It Helped
- Impact categories
- Company Impact
- Impact status
- Optional impact metrics

**Step 3 — Notes and Evidence**

- Notes and Praise
- Image attachments
- Review and mark as Completed

Users can freely navigate between steps without losing saved information.

### 3.6 Autosave and Drafts

Autosave is a core Joti feature.

**Requirements:**

- Save changes automatically using debounced writes.
- Preserve data between form steps.
- Restore saved drafts when reopened.
- Display Saving, Saved, and Save Failed states.
- Provide manual Retry on failed saves.
- Allow users to discard drafts.
- Allow manual entry completion.
- Prevent outdated saves from overwriting newer changes.

**Constraints:**

- Internet connection required.
- Full offline operation excluded.
- Warn users before leaving with unsaved changes.
- Never display failed saves as successful.

### 3.7 Work History and Search

**Views:**

- Timeline of work entries.
- Company-based history.
- Project-based history.

**Filters:**

- Company
- Project
- Date range
- Impact category
- Entry status

**Search:**

- Search task titles and entry descriptions.
- Combine search with filters.

Calendar view is excluded from MVP.

### 3.8 Image Attachments

Users can attach supporting images to entries.

**Requirements:**

- Images only.
- Maximum 5 MB per image.
- Use Convex File Storage.
- Associate attachments with entries.
- Support viewing and removing attachments.
- Validate file size and type.
- Authorize access to attachment metadata and contents.
- Clean up unreferenced files.

Display a privacy reminder before uploading company-related evidence.

### 3.9 Trash and Deletion

**Requirements:**

- Move deleted entries to Trash.
- Retain deleted entries for 30 days.
- Allow restoring entries.
- Permanently delete expired entries and attachments.
- Prevent deleting companies or projects with existing records.
- Confirm destructive actions.

### 3.10 CSV Export

Users can export their work history.

**Requirements:**

- Export entries as CSV.
- Include company, project, date, task, impact, and notes.
- Support Excel and Google Sheets.
- Export only the authenticated user's records.
- Escape CSV values safely.

Image files are excluded from CSV exports.

---

## 4. Navigation and User Experience

### Primary Navigation

1. **Home** — Dashboard and quick actions.
2. **History** — Timeline, search, and filters.
3. **Companies** — Companies and projects.
4. **Settings** — Account, export, Trash, preferences.

The Add Entry action must remain easily accessible.

### UI / UX Requirements

- Support light and dark themes.
- Use consistent design tokens.
- Provide clear loading, empty, success, and error states.
- Keep forms short and easy to navigate.
- Support Android screen sizes and keyboard behavior.
- Follow accessible touch-target and contrast guidelines.
- Use responsive layouts where appropriate.

### Design References

The user will provide UI reference images or mockups.

Codex must study them to understand:

- Component layouts and visual hierarchy.
- Interaction behavior.
- Light and dark color tokens.
- Typography and spacing.
- Responsive breakpoints and layout patterns.

Visual implementation should follow approved references without overriding the PRD.

### Joti Brand Identity

**Brand Personality:**

- Friendly
- Curious
- Supportive
- Organized
- Encouraging

**Mascot Direction:**

Joti is envisioned as a small notebook-inspired companion representing personal growth and meaningful achievements.

The mascot should:

- Feel approachable without being childish.
- Use a simple, recognizable silhouette.
- Work in light and dark modes.
- Appear selectively in onboarding, empty states, and confirmations.
- Avoid distracting users during journaling.

Final mascot visuals and brand colors will be determined using design references.

**Example Microcopy:**

- Empty journal: "Every little achievement counts."
- Successful save: "Another moment worth remembering."
- Returning to history: "Look how far you've come."

---

## 5. Data Model

Initial logical entities:

### Users

- `id`
- `name`
- `email`
- `imageUrl`
- `createdAt`

Authentication-specific data is managed by Convex Auth.

### Companies

- `id`
- `userId`
- `name`
- `jobTitle`
- `startDate`
- `endDate`
- `createdAt`
- `updatedAt`

### Projects

- `id`
- `userId`
- `companyId`
- `name`
- `description`
- `status`
- `isGeneral`
- `createdAt`
- `updatedAt`

### Entries

- `id`
- `userId`
- `companyId`
- `projectId`
- `date`
- `task`
- `whatIDid`
- `whoItHelped`
- `companyImpact`
- `impactCategories`
- `impactStatus`
- `impactMetrics`
- `notesAndPraise`
- `status`
- `deletedAt`
- `createdAt`
- `updatedAt`

### Attachments

- `id`
- `userId`
- `entryId`
- `storageId`
- `fileName`
- `mimeType`
- `fileSize`
- `createdAt`

Use native Convex IDs, indexes, and timestamps where appropriate.

---

## 6. Security and Privacy

### Authentication and Authorization

- Require authentication for private app functionality.
- Enforce ownership in every protected query and mutation.
- Prevent cross-user access through manipulated IDs.
- Validate all backend inputs.
- Secure authentication tokens.
- Avoid logging sensitive information.
- Protect private routes and backend operations.

### File Security

- Validate uploaded images.
- Enforce attachment ownership.
- Protect file delivery using authorized access.
- Avoid unrestricted public file sharing.
- Remove abandoned and expired attachments.

### Company Data Privacy

Display privacy reminders concerning:

- Source code and credentials.
- Customer or employee information.
- Internal documents.
- Confidential company metrics.
- Sensitive screenshots.

Users remain responsible for following their employers' confidentiality policies.

---

## 7. Reliability and Data Integrity

Joti must:

- Handle network failures gracefully.
- Provide clear autosave feedback.
- Prevent duplicate submissions.
- Maintain valid company/project/entry relationships.
- Prevent stale autosave writes.
- Handle archived and deleted records correctly.
- Clean up expired Trash records.
- Validate exported data.
- Avoid exposing sensitive content in logs.

### Minimum Testing

- Authentication and route protection.
- Company and project CRUD.
- Entry CRUD and validation.
- Cross-user authorization.
- Autosave and retry.
- Search and filtering.
- Attachment access restrictions.
- Trash and restoration.
- CSV export.

---

## 8. Implementation Milestones

Each phase must produce a usable, testable result.

### Phase 1 — Foundation

- Initialize Expo, React Native, and TypeScript.
- Configure NativeWind and Convex.
- Implement Google authentication.
- Configure navigation and protected screens.
- Establish theming based on approved UI references.

**Deliverable:** Authenticated Joti application shell.

### Phase 2 — Organization

- Implement company management.
- Implement project management.
- Add General / Adhoc category.
- Build company and project browsing.

**Deliverable:** Organized employment and project history.

### Phase 3 — Core Journal

- Build the three-step guided form.
- Implement entry CRUD.
- Implement drafts and debounced autosave.
- Add save failure and retry handling.
- Implement manual completion.

**Deliverable:** Functional work journal.

### Phase 4 — History and Evidence

- Build dashboard and timeline.
- Implement search and filters.
- Add image attachments.
- Implement privacy reminders and file authorization.

**Deliverable:** Searchable history with supporting evidence.

### Phase 5 — Data Management and Hardening

- Implement 30-day Trash and restoration.
- Add CSV export.
- Finalize inactivity session handling.
- Test access control and edge cases.
- Improve reliability and error handling.

**Deliverable:** Production-ready Android MVP.

---

## 9. Out of Scope

Excluded from the MVP:

- AI-generated content or summaries.
- AI-powered search.
- Resume generation.
- PDF reports.
- Advanced analytics.
- Calendar browsing.
- Notifications and reminders.
- Full offline synchronization.
- Team collaboration.
- Public sharing.
- Web and iOS releases.
- Third-party integrations.

These may be considered in future versions.

---

## 10. MVP Acceptance Criteria

- [ ] Google authentication works securely.
- [ ] Companies and projects can be managed.
- [ ] General / Adhoc tasks are supported.
- [ ] Work entries support full CRUD.
- [ ] Guided entry form works correctly.
- [ ] Drafts and debounced autosave work reliably.
- [ ] Save failures are visible and retryable.
- [ ] Dashboard and work history are functional.
- [ ] Search and filters return accurate results.
- [ ] Image attachments are securely managed.
- [ ] Trash retains entries for 30 days.
- [ ] CSV export works correctly.
- [ ] User records are private and isolated.
- [ ] Light and dark themes follow design references.
- [ ] Core functionality passes testing.

---

## 11. Success Criteria

Joti succeeds when users can:

1. Quickly document meaningful accomplishments.
2. Save and resume unfinished entries.
3. Organize work across companies and projects.
4. Easily find previous contributions.
5. Preserve achievements and evidence securely.
6. Maintain their professional history over time.

**Product Principle:**

> Little notes. Big progress.

Joti should make recording work effortless and remembering achievements meaningful.
