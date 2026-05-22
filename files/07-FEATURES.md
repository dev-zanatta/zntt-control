# 07 — Features Specification

## Feature 1 — Dashboard

**Page:** `DashboardPage.vue`

**Behavior:**
- Loads all projects on mount via `projectsStore.fetchProjects()`
- Displays projects in three sections: Active, Paused, Completed
- Each section only renders if it has projects
- "New Project" button opens `NewProjectModal`

**ProjectCard displays:**
- Left color bar (project's color)
- Logo (image if set, else colored initials block)
- Project name
- Category badge (monospace font, subtle)
- Status badge (paused / completed — not shown for active)
- Progress bar (thin 3px line, filled to percentage)
- Stats line: "8/12 tasks · 66%"
- Hover actions: settings icon, pause/resume icon, delete icon

**Visual rules:**
- Paused projects: 50% opacity, subtle "PAUSED" label
- Completed projects: 40% opacity, checkmark + "COMPLETED" label
- Active projects: full opacity, no label

---

## Feature 2 — Create / Edit Project

**Modal:** `NewProjectModal.vue` (same modal used for edit, with pre-filled data)

**Fields:**
- Name (required, text input)
- Color (color picker — 12 preset colors + custom hex input)
- Logo (file upload — image only, stored in `attachments/projects/{id}/logo.*`)
- Category (autocomplete input — shows existing categories, allows typing new one)

**Columns section:**
- List of column rows: [drag handle] [name input] [done checkbox] [delete button]
- "Add Column" button appends a new row
- Done column: only one can be checked at a time (radio behavior)
- Validation: at least 1 column, exactly 1 done column marked

**On create:**
1. Save project (get project ID)
2. If logo selected, copy file to `attachments/projects/{id}/logo.ext`
3. Update project with logo_path
4. Save all columns with their positions (index order = position)
5. Close modal, refresh dashboard

---

## Feature 3 — Project Board (Kanban)

**Page:** `ProjectBoardPage.vue`

**Header:**
- Back arrow to dashboard
- Project logo + name + category
- Status dropdown/buttons: Active / Pause / Complete
- Settings icon (opens ProjectSettingsModal)

**Board:**
- Horizontal scrollable area
- Columns rendered left-to-right sorted by `position`
- Each column: header with name + task count, scrollable task list, "Add task" at bottom
- Done column has a subtle visual indicator (thin colored top border with accent-teal)

**Drag and Drop (vue-draggable-plus):**
- Tasks draggable within a column (vertical reorder)
- Tasks draggable between columns (cross-column)
- Columns NOT draggable in the board view (reordering via settings only)
- On drag end: call `tasksStore.moveTask(taskId, newColumnId, newPosition)`
- Optimistic UI: vue-draggable-plus handles visual update, IPC confirms persistence

**Add Task (inline):**
- Click "Add task" in a column → shows inline input
- Press Enter or click confirm → creates task in that column at the bottom position
- Press Escape → cancels

---

## Feature 4 — Task Detail Modal

**Modal:** `TaskDetailModal.vue`

**Trigger:** Click any TaskCard

**Layout:**
- `q-dialog` with `maximized` or fixed size (~90vw × 90vh)
- Two-panel layout (CSS grid or flex)

**Left panel (main content ~70%):**
- Title: large, click-to-edit inline
- Description: textarea, click-to-edit, supports multi-line
- Subtasks section:
  - List of subtasks with checkbox + text
  - Checked subtasks shown with strikethrough
  - Inline "Add subtask" input at the bottom
  - Counter: "3/5 subtasks"
- Attachments section:
  - List of files: icon (by mime type) + original filename + size
  - "Open" button — shell.openPath
  - "Delete" button with confirmation
  - "Add File" button — triggers file picker dialog

**Right panel (metadata ~30%):**
- Project (display only, with color dot)
- Column (dropdown to move task to another column)
- Priority (dropdown: None / Low / Medium / High — with colored badge preview)
- Due Date (date picker, clearable)
- Created at (display only, formatted)

**Footer:**
- Delete task button (with confirmation dialog)
- Close button

---

## Feature 5 — Project Settings

**Modal:** `ProjectSettingsModal.vue`

**Sections:**

**General:**
- Edit name, color, logo, category (same fields as create)

**Columns:**
- List of columns with: current name, position, done flag
- Rename inline
- Reorder: up/down arrows (or drag handle)
- Mark as done column (radio)
- Delete column (only if no tasks in it — else show warning with task count)

**Danger Zone:**
- Delete project (requires typing project name to confirm)

---

## Feature 6 — Settings Page

**Page:** `SettingsPage.vue`

**Sections:**

**Appearance:**
- Theme selector: Dark / Light (can extend to more themes)
- Preview swatch next to each option

**Categories:**
- List of all categories with task/project count
- Add new category (inline input)
- Rename category (inline edit)
- Delete category (only if not in use — else show warning)

**About:**
- App name: zntt-control
- Version (read from package.json)
- Data location: displays path to userData folder
- "Open data folder" button (shell.openPath to userData)

---

## Feature 7 — File Attachments

**Flow:**
1. User clicks "Add File" in TaskDetailModal
2. Electron dialog opens (native Windows file picker)
3. User selects a file
4. Main process copies file to `userData/attachments/tasks/{taskId}/{uuid}.ext`
5. Record saved in `attachments` table with original name, stored path, mime, size
6. Attachment list refreshes

**File naming:**
- Stored filename uses UUID to avoid conflicts: `{uuid}{ext}` (e.g. `a1b2c3d4.pdf`)
- `original_name` column preserves the user's original filename for display

**Opening files:**
- `shell.openPath(fullPath)` — opens with Windows default application

**On task delete:**
- All attachment files are deleted from filesystem
- `ON DELETE CASCADE` handles the database records

---

## Feature 8 — Progress Calculation

Progress is calculated at the database query level in `getAllProjects()`:

```sql
SELECT
  p.*,
  COUNT(t.id) AS total_tasks,
  SUM(CASE WHEN col.is_done_column = 1 THEN 1 ELSE 0 END) AS done_tasks
FROM projects p
LEFT JOIN tasks t ON t.project_id = p.id
LEFT JOIN columns col ON col.id = t.column_id
GROUP BY p.id
```

- `total_tasks`: all tasks in the project
- `done_tasks`: tasks currently in a column flagged as `is_done_column = 1`
- `progress %`: `Math.round((done_tasks / total_tasks) * 100)` — 0 if no tasks

---

## Edge Cases to Handle

| Situation | Behavior |
|---|---|
| Project with 0 tasks | Progress = 0%, show "No tasks yet" |
| All tasks in done column | Progress = 100%, subtle celebration style |
| Delete column with tasks | Warn user, show task count, block deletion |
| Delete category in use | Warn user, show usage count, block deletion |
| Attachment file missing on disk | Show warning icon, offer to remove record |
| App opened with corrupted DB | Catch migration error, show user-friendly message |
