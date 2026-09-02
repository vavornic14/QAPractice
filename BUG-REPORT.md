# Bug Report — Task Manager

**Build:** `f7bff68` · **Environment:** Chromium 1280×900, http://localhost:5173 · **Date:** 2026-09-02
**Tester:** Vlad Avornic

Every defect below was reproduced against the running application. Each entry starts from a cleared
`localStorage` unless the steps say otherwise. Values in `code font` are observed verbatim.

Test scenarios and their pass/fail status are tracked separately in `MANUAL-TEST-CASES.md`.

## Summary

| Severity | Functional | Visual / UX | Total |
|---|:---:|:---:|:---:|
| 🔴 Critical | 3 | 0 | **3** |
| 🟠 High | 8 | 0 | **8** |
| 🟡 Medium | 2 | 4 | **6** |
| 🔵 Low | 0 | 4 | **4** |
| **Total** | **13** | **8** | **21** |

**Headline:** three critical defects cause silent, unrecoverable data loss, and all three are
triggered by ordinary actions a user would consider safe — cancelling a dialog, saving without
changes, and deleting a single item. Separately, only *adding* a task is ever written to storage,
so every edit, deletion and completion is lost on refresh.

---

# Functional bugs

## BUG-01 — "Cancel" in the edit form marks the task as complete

**Severity:** 🔴 Critical · **Area:** Edit

**Steps to reproduce**
1. Add a task titled `Cancel me`
2. Click **Edit** on it
3. Click **Cancel**

**Expected**
The edit form closes and the task is left exactly as it was, still incomplete.

**Actual**
The form closes, but the task's action button now reads `Uncomplete` — the task has been marked
complete. The user's explicit "discard my changes" action mutated the task instead.

---

## BUG-02 — Saving an unchanged edit destroys the description, importance and label

**Severity:** 🔴 Critical · **Area:** Edit

**Steps to reproduce**
1. Add a task: title `Keep me`, description `My description`, Importance `High`, Label `Social`
2. Click **Edit**
3. Change nothing at all
4. Click **Save**

**Expected**
The task is unchanged. Description, Importance and Label are all preserved.

**Actual**
`Keep me | (no description) | Importance: Low | Label: Hobby`

The description is erased, Importance is silently downgraded `High → Low`, and Label is silently
changed `Social → Hobby`. Three fields are destroyed by an action that changed nothing — and the
form displayed `High` and `Social` moments earlier, so the user has no reason to expect it.

---

## BUG-03 — Deleting one task removes every task that shares its title

**Severity:** 🔴 Critical · **Area:** Delete

**Steps to reproduce**
1. Add a task titled `Dup task`
2. Add a second task, also titled `Dup task`
3. Confirm two cards are displayed
4. Click **Delete** on the **first** card only

**Expected**
One task is removed. One `Dup task` card remains.

**Actual**
Card count goes `2 → 0`. A single delete click destroys both tasks. Deletion appears to match on
title rather than on the individual task, so every task with that title is removed at once.

There is no confirmation prompt and no undo, so the loss is unrecoverable. This compounds with
BUG-10: multiple blank-titled tasks all share the same empty title, so deleting any one of them
wipes all of them.

---

## BUG-04 — Editing a completed task silently un-completes it

**Severity:** 🟠 High · **Area:** Edit

**Steps to reproduce**
1. Add a task and click **Complete** — the button now reads `Uncomplete`
2. Click **Edit**
3. Click **Save**

**Expected**
The task remains complete after editing.

**Actual**
The action button reads `Complete` again — the task was reverted to incomplete. Any edit to a
finished task quietly reopens it.

---

## BUG-05 — The edit form opens with the description field blank

**Severity:** 🟠 High · **Area:** Edit

**Steps to reproduce**
1. Add a task with the description `My description`
2. Click **Edit**
3. Inspect the description field

**Expected**
The field is pre-filled with `My description` so the user can amend it.

**Actual**
The field is empty (`""`). The existing description is not carried into the form, so a user who
edits only the title and saves will unknowingly delete their description.

---

## BUG-06 — Edit dropdowns do not update when a value is selected

**Severity:** 🟠 High · **Area:** Edit

**Steps to reproduce**
1. Add a task with Importance `High` and Label `Social`
2. Click **Edit**
3. Select Importance = `Medium`
4. Read the dropdown

**Expected**
The dropdown displays `Medium`.

**Actual**
The dropdown still displays `High`. The control never reflects the choice, so the user cannot see
what they are about to save. Saving does store `Medium`, but the Label — never touched, and still
displaying `Social` — is written as `Hobby`.

The edit form is effectively unusable: what it shows and what it saves are two different things.

---

## BUG-07 — Edits are lost after a page reload

**Severity:** 🟠 High · **Area:** Edit / persistence

**Steps to reproduce**
1. Add a task titled `Editme`
2. Click **Edit**, change the title to `Renamed`, click **Save**
3. Confirm the card reads `Renamed`
4. Reload the page

**Expected**
The task is still titled `Renamed`.

**Actual**
The card reads `Editme` again. The edit was applied on screen but never saved, so it is discarded
on refresh.

---

## BUG-08 — Deleted tasks reappear after a page reload

**Severity:** 🟠 High · **Area:** Delete / persistence

**Steps to reproduce**
1. Add a task titled `Persist me`
2. Click **Delete** — the list is now empty
3. Reload the page

**Expected**
The list is still empty.

**Actual**
The task is back (`0 → 1` cards). Deletion appears to succeed, then silently reverts on refresh.

---

## BUG-09 — Completion state is lost after a page reload

**Severity:** 🟠 High · **Area:** Complete / persistence

**Steps to reproduce**
1. Add a task
2. Click **Complete** — the button reads `Uncomplete`
3. Reload the page

**Expected**
The task is still complete.

**Actual**
The button reads `Complete` — the task reverted to incomplete.

Together with BUG-07 and BUG-08 this means only *adding* a task is ever persisted. Every other
change the user makes survives until the next refresh and no longer.

---

## BUG-10 — A task with an empty title can be created

**Severity:** 🟠 High · **Area:** Add / validation

**Steps to reproduce**
1. Load the app and leave every field untouched
2. Click **Add Task**

**Expected**
No task is created, and a validation message identifies the title as required.
The product requirements state that Title is mandatory.

**Actual**
A task is created (`0 → 1` cards). The card has a blank title, no description, and the default
`Importance: Medium / Label: Work`. No validation message appears.

These blank cards cannot be told apart from one another, and because they all share an empty title
they trigger BUG-03 — deleting one removes them all.

---

## BUG-11 — A whitespace-only title is accepted

**Severity:** 🟡 Medium · **Area:** Add / validation

**Steps to reproduce**
1. Enter `     ` (five spaces) as the title
2. Click **Add Task**

**Expected**
The title is trimmed, found to be empty, and rejected.

**Actual**
A task is created with the rendered title `""`. Input is never trimmed, so this produces a blank
card even if the empty-title check in BUG-10 is added.

---

## BUG-12 — Sorting by importance orders alphabetically, not by priority

**Severity:** 🟠 High · **Area:** Sort

**Steps to reproduce**
1. Add three tasks: `Aaa` (Low), `Bbb` (High), `Ccc` (Medium)
2. Select **Sort by Importance (Ascending)**
3. Then select **Sort by Importance (Descending)**

**Expected**
Ascending → `Aaa, Ccc, Bbb` (Low, Medium, High)
Descending → `Bbb, Ccc, Aaa` (High, Medium, Low)

**Actual**
Ascending → `['Bbb', 'Aaa', 'Ccc']` = High, Low, Medium
Descending → `['Ccc', 'Aaa', 'Bbb']` = Medium, Low, High

The importance names are being compared as plain text, so the order is alphabetical
(High < Low < Medium) rather than by priority. Ascending puts the most important task first and
buries Medium below Low.

This defeats the purpose of the feature: neither direction lets a user see their high-priority
work grouped together. Also reproduced with a label filter active.

---

## BUG-13 — A title with leading whitespace is not capitalised

**Severity:** 🟡 Medium · **Area:** Add

**Steps to reproduce**
1. Enter the title `  spaced title` (two leading spaces)
2. Click **Add Task**

**Expected**
`Spaced title` — the requirement is that titles start with a capital letter.

**Actual**
`spaced title`, displayed in lowercase. Capitalisation is applied to the first character, which is
a space, so the actual first letter is never reached. Any title pasted with leading whitespace —
a common case when copying text — breaks the rule.

---

# Visual and UX bugs

## BUG-14 — A completed task looks identical to an incomplete one

**Severity:** 🟡 Medium · **Area:** Complete / visual

**Steps to reproduce**
1. Add a task and note the card's appearance
2. Click **Complete**
3. Compare the card's background colour before and after

**Expected**
The completed card is visually distinct — a green background is clearly the intent, since the
incomplete state is styled grey.

**Actual**
Both states compute to `rgb(255, 255, 255)`. The background never changes; neither the intended
green nor the grey is ever visible. Apart from the small button label switching to `Uncomplete`,
a completed task is indistinguishable at a glance from an unfinished one.

This removes the primary signal the feature exists to provide. In a list of a dozen tasks there is
no way to see at a glance what is done.

---

## BUG-15 — Long titles overflow the task card

**Severity:** 🟡 Medium · **Area:** Task list / layout

**Steps to reproduce**
1. Add a task with a 120-character title (e.g. `A` repeated 120 times)
2. Observe the card

**Expected**
The title wraps, or is truncated with an ellipsis, and stays inside the card. Ideally the input
enforces a sensible maximum length.

**Actual**
The text breaks out of the fixed 250 px card and the card scrolls horizontally
(`scrollWidth > clientWidth`). There is no wrapping, no truncation and no maximum length on the
title field, so a long title visibly breaks the layout.

---

## BUG-16 — "Add Task" looks disabled but is fully clickable

**Severity:** 🟡 Medium · **Area:** Add form / affordance

**Steps to reproduce**
1. Load the app with an empty title field
2. Hover over **Add Task**
3. Click it

**Expected**
Either the button is genuinely disabled while the title is empty, or it looks enabled and shows a
validation message when clicked. The appearance should match the behaviour.

**Actual**
The cursor changes to `not-allowed`, signalling that the button is unavailable — but the button is
not disabled and the click goes through, creating a blank task (BUG-10). The styling actively
misinforms the user about what will happen.

---

## BUG-17 — No confirmation before deleting a task

**Severity:** 🟡 Medium · **Area:** Delete / safety

**Steps to reproduce**
1. Add a task
2. Click **Delete**

**Expected**
A confirmation step, or an undo affordance, before permanent removal.

**Actual**
The task is removed immediately with no prompt and no way to undo. Given that a single click can
destroy several tasks at once (BUG-03), and that the *Delete* button sits directly beside
*Complete* and *Edit*, a misclick is both easy and unrecoverable.

---

## BUG-18 — The "Edit" button shows a loading cursor

**Severity:** 🔵 Low · **Area:** Task list / affordance

**Steps to reproduce**
1. Add a task
2. Hover over the **Edit** button

**Expected**
A pointer cursor, as on any clickable control.

**Actual**
The cursor is `wait`, which conventionally means the application is busy and the user should not
interact. It suggests the button is unresponsive when it is not.

---

## BUG-19 — The "Cancel" button shows a text-selection cursor

**Severity:** 🔵 Low · **Area:** Edit form / affordance

**Steps to reproduce**
1. Add a task and click **Edit**
2. Hover over the **Cancel** button

**Expected**
A pointer cursor.

**Actual**
The cursor is `text`, as though hovering over editable text rather than a button. It reads as
not clickable at all.

---

## BUG-20 — No empty state anywhere in the app

**Severity:** 🔵 Low · **Area:** Task list

**Steps to reproduce**
1. Load the app with no tasks saved
2. Separately: add a `Work` task, then set the label filter to `Social`

**Expected**
A short message such as "You have no tasks yet — add one above", and for the filtered case
"No tasks match this filter".

**Actual**
In both cases the list area is completely blank. A first-time user gets no guidance on how to
begin, and a user who filters to an empty label cannot tell whether the filter matched nothing or
the app has broken.

---

## BUG-21 — Required fields are not marked in the add form

**Severity:** 🔵 Low · **Area:** Add form

**Steps to reproduce**
1. Load the app and inspect the add-task form

**Expected**
The mandatory Title field is visibly marked as required — an asterisk, a "required" hint, or
similar — so the user knows what is needed before submitting.

**Actual**
All four inputs look identical. Nothing distinguishes the mandatory Title from the optional
Description and Label, so the only way to discover the rule is to submit and fail — and currently
submitting does not fail (BUG-10).

---

# Recommended fix order

| Priority | Bugs | Rationale |
|---|---|---|
| 1 | BUG-01, BUG-02, BUG-03 | Critical, silent data loss from ordinary safe-looking actions |
| 2 | BUG-07, BUG-08, BUG-09 | Nothing but "add" is saved; the app cannot be trusted across a refresh |
| 3 | BUG-04, BUG-05, BUG-06 | The edit feature is unusable as a whole, not just individually faulty |
| 4 | BUG-10, BUG-11, BUG-12 | Validation and sorting are visibly wrong to any user |
| 5 | BUG-13 – BUG-21 | Presentation, affordance and safety polish |

---

# Notes for regression coverage

BUG-01, BUG-02 and BUG-03 are automated as the three failing regression tests required by the
homework brief. They were chosen because each is Critical, each causes irreversible data loss, and
each sits in a **different** part of the application — edit-cancel, edit-save and delete. A single
fix therefore cannot turn several of them green at once and hide a defect that is still present.
