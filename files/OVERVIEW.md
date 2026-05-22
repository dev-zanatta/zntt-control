# zntt-control — Project Overview

## Description
Personal project management desktop app for Windows.
Fully local: no cloud, no sync, no external servers.
Built for personal use only — not intended for public release or SaaS.

## Goal
Centralized control of 10+ simultaneous personal projects with Kanban boards,
task tracking, progress visibility and a clean dashboard overview.

## Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | Vue 3 + Quasar Framework |
| Desktop Shell | Electron |
| IPC (communication) | Electron IPC (ipcMain / ipcRenderer) |
| Database | SQLite via better-sqlite3 |
| State Management | Pinia |
| Drag and Drop | vue-draggable-plus |
| Build / Installer | electron-builder (Windows .exe) |

## Architecture Overview

```
[Vue/Quasar Renderer Process]
        ↕ IPC (no HTTP, no ports)
[Electron Main Process — Node.js]
        ↕
[better-sqlite3 — SQLite file]
[File System — userData attachments]
```

No HTTP server. No localhost ports. Communication between frontend and backend
is done entirely through Electron's native IPC bridge.

## Data Storage

All data is stored locally on the user's machine:

```
%APPDATA%\zntt-control\
├── database.sqlite          ← all app data
└── attachments/
    ├── projects/
    │   └── {project-id}/
    │       └── logo.png
    └── tasks/
        └── {task-id}/
            ├── file.pdf
            └── image.png
```

## Key Features

- **Dashboard**: overview of all projects with progress bars, status and counters
- **Kanban Board**: per-project board with fully customizable columns
- **Task Detail**: modal with description, subtasks, attachments, priority, due date
- **Project Management**: create, pause, complete, and configure projects
- **Global Settings**: theme toggle, category management
- **Theme System**: light/dark mode with architecture for multiple themes

## Update Strategy

Manual updates only. New version is installed on top of the old one.
The `userData` directory (database + attachments) is never touched by the installer.
Data is fully preserved across updates.
Migrations handle schema evolution automatically on app startup.

## Target Platform

Windows only (initial version).
Electron build configured exclusively for Windows (.exe installer via electron-builder).
