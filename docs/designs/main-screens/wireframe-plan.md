# Main Screen Flow and Wireframe Plan

This plan follows `docs/PRD.md`. The four tabs show the main destinations; company detail, project detail, and the three-step entry form are separate screens. Mock data in the sheet illustrates layout, not existing functionality.

## First-use journey

1. Open Joti. A valid session goes to Home; otherwise, sign in with Google.
2. On an empty Home, the primary next step is **Add Company**. Creating an entry requires a company. The Add Entry action should guide the user to company setup when none exists.
3. Add a company, then optionally add a project from its detail screen. Each company provides **General / Adhoc** for entries without a dedicated project.
4. Start an entry from Home or History. Choose company and project/category, enter task details, impact, and notes/evidence. Changes autosave as a draft; the user explicitly marks the entry Completed.
5. Return to Home for drafts and recent entries, or History for the full timeline and search.

## Shared frame

Use the same safe-area inset, 20-point content gutters, 56-point title row, and floating four-tab pill. Content scrolls above navigation. Keep 16-point gaps within sections and 24-point gaps between sections. Add Entry is prominent on Home and readily available from History; Companies leads with Add Company. Settings has no creation action.

## Home — dashboard and next action

- Header: Home and Add Entry for users with a company.
- Unfinished drafts: one compact resume row when present; link to the rest in History.
- Recent entries: up to three plain rows and View all to History.
- Quiet context: total recorded entries and current or recently used company/project, without a statistics panel.
- Empty state: clear Add Company action and a short explanation that entries are organized under a company. Avoid showing empty draft and recent-entry sections.
- Mascot: Welcome on sign-in, Organize on empty Home, and a small Rest pose inside an unfinished draft row. Keep entry forms and routine list screens focused on content.

## History — complete work record

- Header: History and an accessible Add Entry action.
- Search and filters: task title/description search; Company, Project, Date, and additional impact/status filters in a sheet.
- Date-grouped entry rows with company/project context. Draft status appears only when relevant.
- Search/filter empty and retry states. Opening a row leads to entry detail; a draft resumes the form.

## Companies — organize work

- Header: Companies. Add Company is the local primary action below it; there is no competing Add Entry button.
- Plain company rows show name, role, dates, and compact project/entry context. Open a company to edit it, add/browse projects, and see related entries.
- A first-company empty state leads to Add Company. Project creation stays inside a company. General / Adhoc is built in.

## Settings — account and data

- Account row, System/Light/Dark appearance control, Export CSV, Trash with 30-day retention note, then Sign out.
- Development diagnostics appear only in development and outside the primary settings flow.

The [first-use mockup](first-use-flow-sheet-v2.png) shows sign-in, empty Home, company setup, and the first entry's task-details step. The [main screen mockup](main-screens-sheet-v5.png) shows the populated daily-use state. The [editable wireframe](main-screens-wireframes-v1.html) shows the four-tab section structure. [Supporting screen sheets](../supporting-screens/README.md) cover company/project detail, the remaining entry steps, data tools, and key states. Mascot poses come from `assets/mascot/joti-2d/`.
