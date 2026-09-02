# Task Manager Test Plan

## Application Overview

The Task Manager is a single-page React application running at http://localhost:5173. Each task has: Title (required string, should start with a capital letter), Description (optional string), Importance (Low/Medium/High, default Medium), Label (Work/Social/Home/Hobby, default Work), and Completeness (boolean, default false). The app supports adding, deleting, editing, marking tasks complete/incomplete, filtering by label, and sorting by importance. Tasks are intended to persist in localStorage under the key "tasks".

Locator guidance:
- The add-task form is the ONLY `<form>` element on the page; it contains a `Task Title` textbox, a `Task Description` textarea, an Importance select and a Label select, followed by an "Add Task" button.
- The two filter/sort dropdowns live in a `.filter-sort` container below the form (label filter first, then importance sort).
- Each task is rendered inside an element with class `.task-item`, containing a heading (title), a paragraph (description, may be empty), a paragraph "Importance: X", a paragraph "Label: Y", and action buttons (Complete/Uncomplete, Delete, Edit).
- Clicking "Edit" on a card replaces that card's content with an inline edit form containing its own Title textbox, Description textarea, Importance select and Label select, plus Save/Cancel buttons. Because the add form and the edit form both contain a textarea and two selects, all edit-form locators MUST be scoped to the specific `.task-item` being edited (e.g. via the task's heading text or nth-match), never using page-level `getByRole('combobox').first()`, to avoid strict-mode violations and to avoid accidentally interacting with the add form.
- IMPORTANT: Before every scenario, clear localStorage (browser_localstorage_clear or `localStorage.clear()` + reload) and reload the page to guarantee a blank slate, since state leaks across scenarios via localStorage key "tasks".

All scenarios below were manually verified in the live running application on 2026-09-02 before being included.

## Test Scenarios

### 1. User Stories

**Seed:** none - specs are self-contained (the init-agents seed stub was removed)

#### 1.1. US-01 Add a task with all fields populated (EXPECTED TO PASS)

**File:** `tests/e2e/us-01-add-task-all-fields.spec.ts`

**Steps:**
  1. Navigate to http://localhost:5173 with a cleared localStorage (fresh page load).
  2. Fill the 'Task Title' textbox in the add form with 'Buy groceries'.
  3. Fill the 'Task Description' textarea in the add form with 'Get milk and eggs'.
  4. Select 'High' in the Importance select of the add form.
  5. Select 'Home' in the Label select of the add form.
  6. Click the 'Add Task' button.
    - expect: A new .task-item card appears with heading 'Buy groceries'.
    - expect: The card's description paragraph reads 'Get milk and eggs'.
    - expect: The card shows 'Importance: High'.
    - expect: The card shows 'Label: Home'.
    - expect: The card's toggle button reads 'Complete' (i.e. task starts incomplete).
    - expect: The add form's Title and Description fields are cleared after submission.

#### 1.2. US-02 Add a task using only the required Title, verifying documented defaults (EXPECTED TO PASS)

**File:** `tests/e2e/us-02-add-task-defaults.spec.ts`

**Steps:**
  1. Navigate to http://localhost:5173 with a cleared localStorage (fresh page load).
  2. Fill the 'Task Title' textbox with 'Default task'. Leave Description empty and leave the Importance and Label selects at their pre-selected values.
  3. Click the 'Add Task' button.
    - expect: A new .task-item card appears with heading 'Default task'.
    - expect: The card's description paragraph is empty.
    - expect: The card shows 'Importance: Medium' (default).
    - expect: The card shows 'Label: Work' (default).
    - expect: The card's toggle button reads 'Complete', confirming Completeness defaults to false.

#### 1.3. US-03 Toggle a task's completion state via the Complete/Uncomplete button (EXPECTED TO PASS)

**File:** `tests/e2e/us-03-toggle-complete.spec.ts`

**Steps:**
  1. Navigate to http://localhost:5173 with a cleared localStorage (fresh page load).
  2. Add a task titled 'Toggle task' using only the Title field, then click 'Add Task'.
  3. Locate the 'Toggle task' .task-item card and click its 'Complete' button.
    - expect: The button on the 'Toggle task' card now reads 'Uncomplete' (button label changed, ignore any card colour).
  4. Click the same button again (now labelled 'Uncomplete').
    - expect: The button on the 'Toggle task' card reads 'Complete' again, confirming the toggle works in both directions.

#### 1.4. US-04 Delete a task when task titles are distinct (EXPECTED TO PASS)

**File:** `tests/e2e/us-04-delete-distinct-title.spec.ts`

**Steps:**
  1. Navigate to http://localhost:5173 with a cleared localStorage (fresh page load).
  2. Add a task titled 'Buy groceries' (Title only, click Add Task).
  3. Add a second task titled 'Default task' (Title only, click Add Task).
    - expect: Two .task-item cards are visible: 'Buy groceries' and 'Default task'.
  4. Click the 'Delete' button on the 'Buy groceries' card.
    - expect: The 'Buy groceries' card is removed from the page.
    - expect: Exactly one .task-item card remains, with heading 'Default task'.

#### 1.5. US-05 Filter tasks by Label (EXPECTED TO PASS)

**File:** `tests/e2e/us-05-filter-by-label.spec.ts`

**Steps:**
  1. Navigate to http://localhost:5173 with a cleared localStorage (fresh page load).
  2. Add a task titled 'Work task' (Title only, Label defaults to Work), click Add Task.
  3. Add a task titled 'Social task', set its Label select (in the add form) to 'Social', click Add Task.
    - expect: Two .task-item cards are visible: 'Work task' (Label: Work) and 'Social task' (Label: Social).
  4. In the .filter-sort area, select 'Social' in the label filter dropdown.
    - expect: Only the 'Social task' card remains visible.
    - expect: The 'Work task' card is no longer visible.
  5. Change the label filter dropdown back to 'All'.
    - expect: Both 'Work task' and 'Social task' cards are visible again.

### 2. Regression Tests

**Seed:** none - specs are self-contained (the init-agents seed stub was removed)

#### 2.1. REG-01 Saving an unmodified edit must preserve description, importance and label (EXPECTED TO FAIL - known bug)

**File:** `tests/regression/reg-01-edit-save-preserves-fields.spec.ts`

**Steps:**
  1. Navigate to http://localhost:5173 with a cleared localStorage (fresh page load).
  2. Fill Title 'Keep me', Description 'My description', select Importance 'High', select Label 'Social' in the add form, then click 'Add Task'.
    - expect: The 'Keep me' card shows description 'My description', 'Importance: High', 'Label: Social'.
  3. Click the 'Edit' button on the 'Keep me' card.
    - expect: The inline edit form for 'Keep me' opens, scoped to that card.
  4. Without changing any field, click the 'Save' button on the inline edit form.
    - expect: CORRECT BEHAVIOUR (currently fails): the 'Keep me' card still shows description 'My description'.
    - expect: CORRECT BEHAVIOUR (currently fails): the card still shows 'Importance: High'.
    - expect: CORRECT BEHAVIOUR (currently fails): the card still shows 'Label: Social'.
    - expect: OBSERVED BUG (reproduced 2026-09-02): after Save, the description paragraph is empty, the card shows 'Importance: Low', and 'Label: Hobby'.
    - MECHANISM (corrected on review): the edit form's Description textarea is not pre-populated and renders empty. The two selects are the subtle part - they DISPLAY the task's real values ('High' and 'Social', confirmed by reading their values while the form is open) because they are bound to the task for display, while the edit state behind them was independently initialised to 'Low' / 'Hobby'. Saving writes that hidden state, so the user sees High/Social and silently saves Low/Hobby.
    - NOTE: 'Hobby' is not the first <option> in the Label list ('Work' is), which rules out the "selects reset to their first option" explanation - the values are set explicitly. Any test asserting that the open edit form displays 'Low' would be WRONG and would fail for the wrong reason.

#### 2.2. REG-02 Cancelling an edit must not change completion state (EXPECTED TO FAIL - known bug)

**File:** `tests/regression/reg-02-cancel-edit-preserves-completion.spec.ts`

**Steps:**
  1. Navigate to http://localhost:5173 with a cleared localStorage (fresh page load).
  2. Add a task titled 'Cancel me' (Title only, click Add Task).
    - expect: The 'Cancel me' card's toggle button reads 'Complete', confirming it starts incomplete.
  3. Click the 'Edit' button on the 'Cancel me' card.
    - expect: The inline edit form for 'Cancel me' opens.
  4. Without changing any field, click the 'Cancel' button on the inline edit form.
    - expect: CORRECT BEHAVIOUR (currently fails): the 'Cancel me' card's toggle button still reads 'Complete' (task remains incomplete, unchanged by the cancelled edit).
    - expect: OBSERVED BUG (reproduced 2026-09-02): after clicking Cancel, the card's toggle button now reads 'Uncomplete', i.e. the task was flipped to complete even though the edit was cancelled and no field was touched.

#### 2.3. REG-03 Deleting one of two tasks that share a title must remove only that one (EXPECTED TO FAIL - known bug)

**File:** `tests/regression/reg-03-delete-only-targeted-task.spec.ts`

**Steps:**
  1. Navigate to http://localhost:5173 with a cleared localStorage (fresh page load).
  2. Add a task titled 'Dup task' (Title only, click Add Task).
  3. Add a second task also titled 'Dup task' (Title only, click Add Task).
    - expect: Exactly two .task-item cards are visible, both with heading 'Dup task'.
  4. Click the 'Delete' button on the FIRST 'Dup task' card.
    - expect: CORRECT BEHAVIOUR (currently fails): exactly one .task-item card remains, with heading 'Dup task' (the second one).
    - expect: OBSERVED BUG (reproduced 2026-09-02): both 'Dup task' cards are removed; the list goes from 2 .task-item cards to 0. Root cause: delete appears to match tasks by title text rather than a unique id, so it removes every task sharing that title.

### 3. Visual / Combination Tests

**Seed:** none - specs are self-contained (the init-agents seed stub was removed)

#### 3.1. VIS-01 Add and screenshot all 24 Importance x Label x Completeness combinations

**IMPLEMENTATION DEVIATION (decided on review, deliberate):** the steps below describe ONE test looping over 24 combinations and accumulating cards. The implemented spec instead GENERATES 24 SEPARATE TESTS at collection time, each independent and starting from cleared storage. Reasons:
  - The homework asks for "a test that generates a test of all possible combinations" - 24 generated tests, not one loop.
  - In a single looping test, a failure at combination 7 aborts the run and combinations 8-24 are never screenshotted, so the requirement silently goes unmet. As separate tests, one failure costs one screenshot.
  - Independent tests keep each screenshot to a single card, so an Argos baseline for combination 3 does not change every time combination 2 changes. Cumulative screenshots would make every diff unreadable.
  - They parallelise, and the report names the exact failing combination.
The index formula, naming scheme and per-combination assertions below are implemented as written.

**File:** `tests/visual/vis-01-all-combinations.spec.ts`

**Steps:**
  1. Navigate to http://localhost:5173 and clear localStorage, then reload for a blank slate.
  2. Define the combination matrix: Importance in ['Low','Medium','High'] x Label in ['Work','Social','Home','Hobby'] x Completeness in [false,true] = 24 combinations, iterated in that nested order (Importance outer loop, then Label, then Completeness) so combination index N (1-24) is deterministic: index = (importanceIdx * 8) + (labelIdx * 2) + completenessIdx + 1.
  3. For each combination: fill the add form's Title textbox with a unique, capitalized title of the form 'Combo <index> <Importance> <Label> <Complete|Incomplete>' (e.g. 'Combo 1 Low Work Incomplete'); fill Description with 'Auto-generated combination <index>'; select the combination's Importance in the add form's Importance select; select the combination's Label in the add form's Label select; click 'Add Task'.
  4. If the combination's Completeness is true, locate the newly added .task-item card by its unique title heading and click its 'Complete' button so the toggle changes from 'Complete' to 'Uncomplete'.
    - expect: The newly added .task-item card is visible with the expected heading, description, 'Importance: <value>', 'Label: <value>', and toggle button reading 'Uncomplete' if Completeness is true or 'Complete' if false.
  5. Take a full-page screenshot immediately after this combination's task has been added (and, if applicable, marked complete), saving it with the deterministic filename 'combo-<index>-<importance>-<label>-<completeness>.png' (e.g. 'combo-01-low-work-incomplete.png', 'combo-24-high-hobby-complete.png'), where <index> is zero-padded to 2 digits, <importance> and <label> are lowercase, and <completeness> is either 'complete' or 'incomplete'.
  6. Repeat the add-(optionally complete)-screenshot sequence for all remaining combinations in order, so that by the end 24 .task-item cards exist on the page and 24 screenshots have been captured, one per combination, each showing the cumulative state of the list at the moment that combination's task was finalized.
    - expect: After the final (24th) combination, the page contains exactly 24 .task-item cards, one for every unique Importance x Label x Completeness combination, and 24 screenshot files named combo-01-... through combo-24-... exist, each corresponding to the state right after its combination was added/completed.
