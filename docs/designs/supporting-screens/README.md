# Supporting Screen Mockups

These 2×2 sheets extend the [main screen flow](../main-screens/wireframe-plan.md). They are design proposals for the PRD, not implemented app screens. The populated examples use Northstar Studio and its Atlas project so the path remains consistent across sheets.

| Sheet                                                       | Screens                                                         | Place in the flow                                              |
| ----------------------------------------------------------- | --------------------------------------------------------------- | -------------------------------------------------------------- |
| [Organization](organization-sheet-v1.png)                   | Company detail, Add project, Project detail, Edit company       | Companies → company → project; General / Adhoc is built in.    |
| [Entry flow](entry-flow-sheet-v1.png)                       | Task details, Impact, Notes and evidence, Entry detail          | Add Entry → three guided steps → completed entry.              |
| [Data tools](data-tools-sheet-v1.png)                       | History filters, Evidence preview, Trash, Export CSV            | Open from History, an entry, or Settings.                      |
| [States](states-sheet-v2.png)                               | No results, Save failed, Entry completed, Delete entry          | Search, autosave recovery, confirmed completion, and deletion. |
| [Empty and project](empty-and-project-sheet-v1.png)         | Empty Companies, no named projects, empty History, Edit project | First use and project maintenance.                             |
| [Edit and confirmation](edit-and-confirmation-sheet-v1.png) | Resume draft, Edit entry, Discard draft, Archive project        | Continue work and confirm consequential actions.               |
| [Android handoffs](android-handoff-sheet-v1.png)            | Permanent delete, image picker, CSV save/share, expired session | System and security handoffs.                                  |
| [Loading and errors](loading-and-error-sheet-v1.png)        | Opening Joti, loading Home, connection failure, upload failure  | Honest waiting and retry states.                               |

## Interaction notes

- Company and project forms are full-screen routes. Project creation starts within a company; General / Adhoc exists even when there are no named projects. Company/project deletion is unavailable while related records remain.
- Entry forms show no bottom tabs. Moving between steps preserves values and autosaves a draft. The only completion action is **Mark completed** on the review step. A failed save leaves typed text visible and offers **Retry**.
- Evidence is private and limited to images. Show the confidentiality reminder before upload. Deleting an entry first asks for confirmation; Trash keeps it recoverable for 30 days. Permanent deletion has its own confirmation.
- Use the approved Search, Retry, and Celebrate mascot poses only in the three matching states. Completion feedback appears after the backend confirms completion.
- The Android picker and CSV save/share surfaces are conceptual. Their exact controls vary by OS version; Joti does not own or style them. An expired session reveals no private journal content.

## Generation brief

Generated with the built-in image tool, using `../main-screens/main-screens-sheet-v5.png` as the style reference and original transparent mascot poses where appropriate. The final prompt set requested four-phone sheets with Joti's near-white/navy/blue tokens, compact pill actions, Inter-like type, restrained dividers, realistic work-journal examples, and no dense card stacks. The organization prompt specified company/project detail and forms; the entry prompt specified the PRD's three steps and detail view; the data prompt specified filters, evidence, Trash, and CSV export; the states prompt specified search empty, save failure, completion, and delete confirmation. Targeted edits corrected the project description, evidence privacy line, save-failure controls, and no-results query. No app code or original mascot assets were changed.

The additional prompt set specified empty Companies/History, a company with no named projects, Edit project, draft resume/edit, discard/archive confirmations, permanent deletion, Android image and CSV handoffs, session expiry, loading, connection failure, and upload failure. Targeted edits removed a duplicate empty-History action and a manual Save button from the autosaved entry form. These sheets cover the planned screen families; forms can reuse components for create and edit, and short confirmation/loading variants do not need separate navigation destinations.
