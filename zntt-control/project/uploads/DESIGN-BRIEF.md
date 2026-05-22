# zntt-control — Design Brief (Claude Design)

## Context
Desktop app for personal project management.
Built with Quasar + Electron. Windows only. No cloud, no accounts.
This brief is for generating the visual layout and UI prototype.

---

## Visual Identity

**Personality:** Clean, dev-like, minimal. No clutter, no decorative excess.
Inspired by: VSCode meets Linear. Functional beauty.

**Key principles:**
- Information density is low-to-medium — no overwhelming screens
- Whitespace is used deliberately
- Colors serve function, not decoration
- Typography is the main design element

---

## Theme System

The app supports light and dark themes with a toggle.
Design both. Dark is the default.

**Dark theme palette:**
```
Background:        #0d0d0d
Surface (cards):   #1a1a1a
Surface alt:       #222222
Hover:             #2a2a2a
Border:            #2a2a2a
Accent (purple):   #7c6af7
Teal highlight:    #3ecfcf
Text primary:      #e8e8e8
Text secondary:    #888888
Danger:            #e05c5c
Success:           #4caf82
Warning:           #e0a050
```

**Light theme palette:**
```
Background:        #f0f0f0
Surface:           #ffffff
Border:            #e0e0e0
Accent:            #6b58e8
Teal:              #2ab5b5
Text primary:      #1a1a1a
Text secondary:    #666666
```

**Typography:**
- UI font: Inter (400, 500, 600)
- Monospace accents: JetBrains Mono (badges, IDs, metadata)

---

## Layout Structure

```
┌──────────────────────────────────────────┐
│ [64px sidebar] │  Main content area       │
│                │                          │
│  ● Dashboard   │  (changes per route)     │
│  ● Settings    │                          │
│                │                          │
│  [theme toggle]│                          │
│  at bottom     │                          │
└──────────────────────────────────────────┘
```

- Sidebar: narrow (64px), icon-only, no labels
- No topbar — each page has its own contextual header
- Clean separation between sidebar and content (1px border)

---

## Screen 1 — Dashboard

**Purpose:** Overview of all personal projects at a glance

**Layout:** Grid of project cards (3 columns on standard width)

**ProjectCard:**
```
┌─────────────────────────────────────┐
│ ▐ [Logo/initials]  Project Name     │
│   Category tag        [status badge]│
│                                     │
│   ████████████░░░░░░ 66%            │  ← thin progress line
│   8/12 tasks                        │
└─────────────────────────────────────┘
```
- Left colored bar (3px, project's color)
- Logo: 36px rounded square, image or colored block with initials
- Category: monospace font, muted color, small
- Status badge: only shown for paused/completed
- Progress bar: 3px height, thin and elegant
- Stats: "8/12 tasks · 66%"
- Hover: reveals 3 action icons (settings, pause, delete)
- Paused/completed cards: reduced opacity

**Header:**
- Page title: "Projects" (left-aligned, large)
- "+ New Project" button (top right, accent color)

---

## Screen 2 — Project Board (Kanban)

**Purpose:** Individual project work view, full page

**Header:**
```
← [Logo] Project Name  [Category]  [● Active ▾]  [⚙ Settings]
```

**Board area:**
- Horizontal scrollable columns
- Each column: fixed width (~280px), full height
- Column header: name (bold), task count (muted badge)
- Done column: subtle teal top border indicator
- Task cards stacked vertically with small gap

**TaskCard:**
```
┌──────────────────────────────┐
│ Task title here              │
│ ● HIGH    📎 2    ✓ 1/3     │  ← priority badge, attachments, subtasks
│                     Mar 15   │  ← due date (right-aligned, muted)
└──────────────────────────────┘
```
- Drag handle visible on hover (left side, ⠿ icon)
- Priority badge: colored dot + label
- Icons: paperclip count, checklist ratio

**Column footer:**
```
+ Add task
```

**Board footer:**
```
[+ Add column]   ← at the right end of all columns
```

---

## Screen 3 — Task Detail Modal

**Purpose:** Full task editing, ~90% of screen

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│ ✕                                              [Delete] │
├───────────────────────────────────┬─────────────────────┤
│                                   │                     │
│  # Task title (editable)          │  Project    zntt    │
│                                   │  Column     ▾ Done  │
│  Description...                   │  Priority   ▾ High  │
│                                   │  Due Date   Mar 15  │
│  ─── Subtasks ──────────────────  │                     │
│  ☑ Subtask one (done)             │  Created            │
│  ☐ Subtask two                    │  Feb 10, 2025       │
│  + Add subtask                    │                     │
│                                   │                     │
│  ─── Attachments ───────────────  │                     │
│  📄 report.pdf  4.2MB  [↗] [✕]   │                     │
│  + Add file                       │                     │
│                                   │                     │
└───────────────────────────────────┴─────────────────────┘
```

- Dark overlay behind modal
- Subtle border/shadow on modal
- Right column: metadata with thin dividers between items
- Subtasks: completed ones slightly muted with strikethrough

---

## Screen 4 — New Project Modal

**Purpose:** Create a new project

**Size:** Medium (600px wide, auto height)

```
┌─────────────────────────────────┐
│  New Project                 ✕  │
├─────────────────────────────────┤
│  Name      [                 ]  │
│  Color     [● ● ● ● ● ● +hex]  │
│  Logo      [Upload image...   ] │
│  Category  [type or select... ] │
│                                 │
│  ─── Columns ─────────────────  │
│  ⠿  [Backlog      ] [done: ○]  │
│  ⠿  [In Progress  ] [done: ○]  │
│  ⠿  [Done         ] [done: ●]  │
│  + Add column                   │
│                                 │
│         [Cancel]  [Create →]    │
└─────────────────────────────────┘
```

---

## Screen 5 — Settings Page

**Purpose:** Global app configuration

**Sections (full page, left-aligned content, max-width ~600px):**

```
Appearance
──────────
Theme    [● Dark]  [  Light  ]

Categories
──────────
Personal          [rename] [delete]
Work              [rename] [delete]
Study             [rename] [delete]
[+ Add category]

About
──────────
zntt-control v1.0.0
Data folder: C:\Users\...\AppData\Roaming\zntt-control
[Open data folder ↗]
```

---

## Component Style Notes

**Buttons:**
- Primary: accent background, white text, 6px radius
- Secondary: transparent, border, accent text
- Danger: danger color, only shown in destructive contexts
- Ghost: no border, subtle hover background

**Inputs:**
- Minimal border (1px, border color)
- Focus: accent color border
- Background: surface-2 color
- No floating labels — use simple placeholder or above-field labels

**Badges:**
- Priority High: red background (muted) + red text
- Priority Medium: orange muted
- Priority Low: green muted
- Status Paused: warning muted
- Status Completed: success muted
- Category: monospace font, border style (no background fill)

**Progress bar:**
- Height: 3px
- Background: border color
- Fill: project accent color OR --zntt-accent
- Border radius: 2px

**Dividers:**
- Use sparingly, 1px, border-subtle color

**Drag handles:**
- ⠿ icon, visible only on hover
- Cursor: grab / grabbing
