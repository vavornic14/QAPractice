# Manual Test Scenarios — Task Manager

Build `f7bff68` · Chromium 1280×900 · executed 2026-09-02
Precondition for every scenario: `localStorage` cleared, page reloaded.

| Result | Count | Scenarios |
|---|:---:|---|
| ✅ Pass | 6 | TC-01, TC-02, TC-05, TC-11, TC-14, TC-17 |
| ❌ Fail | 13 | TC-03, TC-04, TC-06, TC-07, TC-08, TC-09, TC-10, TC-12, TC-13, TC-15, TC-16, TC-19, TC-20 |
| ⚠️ Partial | 1 | TC-18 |

---

## TC-01 — Add a task with all fields populated

**Steps**
1. Enter title `buy milk`
2. Enter description `Two litres`
3. Set Importance = `High`
4. Set Label = `Home`
5. Click **Add Task**

**Acceptance criteria**
- A card appears in the list
- Title displays as `Buy milk`
- Description, Importance and Label match the input
- Action button reads `Complete`

**Current result**
`Buy milk | Two litres | Importance: High | Label: Home | Complete Delete Edit`

**Status:** ✅ Pass

---

## TC-02 — Add a task with only a title

**Steps**
1. Enter title `Only title`
2. Leave description blank, do not touch either dropdown
3. Click **Add Task**

**Acceptance criteria**
- Task is created
- Importance defaults to `Medium`
- Label defaults to `Work`
- Action button reads `Complete`

**Current result**
`Only title | Importance: Medium | Label: Work | Complete Delete Edit`

**Status:** ✅ Pass

---

## TC-03 — Submit with an empty title

**Steps**
1. Leave every field untouched
2. Click **Add Task**

**Acceptance criteria**
- No task is created
- A validation message identifies the title as required

**Current result**
Task created, card count `0 → 1`. Card renders with an empty `<h3>`, `Importance: Medium`, `Label: Work`. No validation message. *Add Task* has class `cursor-not-allowed` but `isDisabled()` = `false`.

**Status:** ❌ Fail — 🟠 High

---

## TC-04 — Submit a whitespace-only title

**Steps**
1. Enter title `     ` (five spaces)
2. Click **Add Task**

**Acceptance criteria**
- Title is trimmed, then rejected as empty
- No task is created

**Current result**
Task created, card count `0 → 1`. Rendered title is `""`.

**Status:** ❌ Fail — 🟠 High

---

## TC-05 — Capitalise the first letter of the title

**Steps**
1. Enter title `buy milk`
2. Click **Add Task**
3. Repeat with title `ĝeneva lower`

**Acceptance criteria**
- Displayed title reads `Buy milk`
- Non-ASCII first character is also capitalised → `Ĝeneva lower`

**Current result**
`Buy milk` · `Ĝeneva lower`

**Status:** ✅ Pass

---

## TC-06 — Capitalise a title with leading whitespace

**Steps**
1. Enter title `  spaced title` (two leading spaces)
2. Click **Add Task**

**Acceptance criteria**
- Title is trimmed then capitalised → `Spaced title`

**Current result**
`spaced title` — rendered lowercase.

**Status:** ❌ Fail — 🟡 Medium

---

## TC-07 — Edit form pre-populates with current values

**Preconditions:** task `Keep me` / `My description` / `High` / `Social`

**Steps**
1. Click **Edit** on the task
2. Read back every field in the inline edit form

**Acceptance criteria**
- Title field = `Keep me`
- Description field = `My description`
- Importance dropdown = `High`
- Label dropdown = `Social`

**Current result**
Title `Keep me` ✅ · Description `""` ✅→❌ wiped · Importance dropdown displays `High`, Label dropdown displays `Social`, but the underlying edit state holds `Low` / `Hobby`.

**Status:** ❌ Fail — 🔴 Critical

---

## TC-08 — Save an edit without changing anything

**Preconditions:** task `Keep me` / `My description` / `High` / `Social`

**Steps**
1. Click **Edit**
2. Change nothing
3. Click **Save**

**Acceptance criteria**
- Description, Importance and Label are all unchanged

**Current result**
`Keep me | (no description) | Importance: Low | Label: Hobby`

**Status:** ❌ Fail — 🔴 Critical → **REG-01**

---

## TC-09 — Changing an edit dropdown updates the visible value

**Preconditions:** task `Dropdown task` / `High` / `Social`

**Steps**
1. Click **Edit**
2. Select Importance = `Medium`
3. Read the dropdown value
4. Click **Save**

**Acceptance criteria**
- Dropdown reads `Medium` after selection
- Saved task = Importance `Medium`, Label `Social`

**Current result**
Dropdown still reads `High` after selecting `Medium`. Saved card: `Dropdown task | Importance: Medium | Label: Hobby`.

**Status:** ❌ Fail — 🟠 High

---

## TC-10 — Cancel an edit

**Preconditions:** incomplete task `Cancel me`

**Steps**
1. Click **Edit**
2. Click **Cancel**

**Acceptance criteria**
- Edit form closes
- Task is unchanged, action button still reads `Complete`

**Current result**
Form closes, action button now reads `Uncomplete` — task was marked complete.

**Status:** ❌ Fail — 🔴 Critical → **REG-02**

---

## TC-11 — Delete a single task

**Preconditions:** two tasks with distinct titles

**Steps**
1. Click **Delete** on the first task

**Acceptance criteria**
- Only that task is removed
- The second task remains

**Current result**
One card removed, one remains.

**Status:** ✅ Pass

---

## TC-12 — Delete one of two tasks sharing a title

**Steps**
1. Add a task titled `Dup task`
2. Add a second task titled `Dup task`
3. Confirm 2 cards are shown
4. Click **Delete** on the first card only

**Acceptance criteria**
- Exactly one task is removed
- One `Dup task` card remains

**Current result**
Card count `2 → 0`. Both tasks removed by one click.

**Status:** ❌ Fail — 🔴 Critical → **REG-03**

---

## TC-13 — Deleted task stays deleted after reload

**Steps**
1. Add task `Persist me`
2. Click **Delete**, confirm the list is empty
3. Reload the page

**Acceptance criteria**
- List is still empty after reload

**Current result**
After delete `0` cards; after reload `1` card — the task returns.

**Status:** ❌ Fail — 🟠 High

---

## TC-14 — Toggle complete / incomplete

**Steps**
1. Add a task
2. Click **Complete**
3. Click **Uncomplete**

**Acceptance criteria**
- Button label alternates `Complete` ⇄ `Uncomplete`

**Current result**
Label toggles correctly in both directions.

**Status:** ✅ Pass

---

## TC-15 — Completed task is visually distinguishable

**Steps**
1. Add a task, read the card's computed `background-color`
2. Click **Complete**
3. Read the computed `background-color` again

**Acceptance criteria**
- The two colours differ; completed card is green

**Current result**
Incomplete `rgb(255, 255, 255)` · Completed `rgb(255, 255, 255)` — identical.

**Status:** ❌ Fail — 🟡 Medium

---

## TC-16 — Completion survives a reload

**Steps**
1. Add a task
2. Click **Complete**
3. Reload the page

**Acceptance criteria**
- Action button still reads `Uncomplete`

**Current result**
After reload the button reads `Complete` — task reverted to incomplete.

**Status:** ❌ Fail — 🟠 High

---

## TC-17 — Filter tasks by label

**Preconditions:** three tasks labelled `Work`, `Home`, `Hobby`

**Steps**
1. Select `Home` in the label filter

**Acceptance criteria**
- Only the `Home` task is listed

**Current result**
`['Home one']`

**Status:** ✅ Pass

---

## TC-18 — Reset filter to "All", and filter with no matches

**Preconditions:** three tasks labelled `Work`, `Home`, `Hobby`

**Steps**
1. Select `All` in the label filter
2. Clear storage, add a single `Work` task
3. Select `Social` in the label filter

**Acceptance criteria**
- `All` lists all three tasks
- `Social` lists zero tasks and shows a "no matching tasks" message

**Current result**
`All` → `['Work one', 'Home one', 'Hobby one']` ✅ · `Social` → `0` cards, list area completely blank, no message.

**Status:** ⚠️ Partial — 🔵 Low

---

## TC-19 — Sort by importance, ascending

**Preconditions:** tasks `Aaa` (Low), `Bbb` (High), `Ccc` (Medium)

**Steps**
1. Select **Sort by Importance (Ascending)**

**Acceptance criteria**
- Order is Low → Medium → High: `Aaa, Ccc, Bbb`

**Current result**
`['Bbb', 'Aaa', 'Ccc']` — High, Low, Medium (alphabetical).

**Status:** ❌ Fail — 🟠 High

---

## TC-20 — Sort by importance, descending

**Preconditions:** tasks `Aaa` (Low), `Bbb` (High), `Ccc` (Medium)

**Steps**
1. Select **Sort by Importance (Descending)**

**Acceptance criteria**
- Order is High → Medium → Low: `Bbb, Ccc, Aaa`

**Current result**
`['Ccc', 'Aaa', 'Bbb']` — Medium, Low, High (reverse alphabetical).

**Status:** ❌ Fail — 🟠 High
