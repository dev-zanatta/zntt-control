# 05 — Frontend Architecture

## Router

**`src/router/routes.js`**
```js
const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'dashboard',
        component: () => import('pages/DashboardPage.vue')
      },
      {
        path: 'project/:id',
        name: 'project-board',
        component: () => import('pages/ProjectBoardPage.vue')
      },
      {
        path: 'settings',
        name: 'settings',
        component: () => import('pages/SettingsPage.vue')
      }
    ]
  }
]

export default routes
```

---

## Pinia Stores

### `projectsStore.js`
```js
import { defineStore } from 'pinia'
import { useIpc } from 'src/composables/useIpc'

export const useProjectsStore = defineStore('projects', {
  state: () => ({
    projects: [],
    currentProject: null,
    loading: false
  }),

  getters: {
    activeProjects: (state) => state.projects.filter(p => p.status === 'active'),
    pausedProjects: (state) => state.projects.filter(p => p.status === 'paused'),
    completedProjects: (state) => state.projects.filter(p => p.status === 'completed'),

    projectProgress: (state) => (projectId) => {
      const p = state.projects.find(p => p.id === projectId)
      if (!p || p.total_tasks === 0) return 0
      return Math.round((p.done_tasks / p.total_tasks) * 100)
    }
  },

  actions: {
    async fetchProjects() {
      const api = useIpc()
      this.loading = true
      this.projects = await api.getProjects()
      this.loading = false
    },

    async fetchProject(id) {
      const api = useIpc()
      this.currentProject = await api.getProject(id)
    },

    async createProject(data) {
      const api = useIpc()
      const project = await api.createProject(data)
      this.projects.unshift(project)
      return project
    },

    async updateProject(id, data) {
      const api = useIpc()
      const updated = await api.updateProject(id, data)
      const idx = this.projects.findIndex(p => p.id === id)
      if (idx !== -1) this.projects[idx] = updated
      if (this.currentProject?.id === id) this.currentProject = updated
    },

    async updateProjectStatus(id, status) {
      const api = useIpc()
      const updated = await api.updateProjectStatus(id, status)
      const idx = this.projects.findIndex(p => p.id === id)
      if (idx !== -1) this.projects[idx] = updated
    },

    async deleteProject(id) {
      const api = useIpc()
      await api.deleteProject(id)
      this.projects = this.projects.filter(p => p.id !== id)
    }
  }
})
```

---

### `tasksStore.js`
```js
import { defineStore } from 'pinia'
import { useIpc } from 'src/composables/useIpc'

export const useTasksStore = defineStore('tasks', {
  state: () => ({
    columns: [],          // columns with their tasks embedded
    selectedTask: null,
    loading: false
  }),

  getters: {
    tasksByColumn: (state) => (columnId) => {
      const col = state.columns.find(c => c.id === columnId)
      return col ? [...col.tasks].sort((a, b) => a.position - b.position) : []
    }
  },

  actions: {
    async fetchBoard(projectId) {
      const api = useIpc()
      this.loading = true
      // Returns columns array, each with tasks[] embedded
      this.columns = await api.getTasksByProject(projectId)
      this.loading = false
    },

    async openTask(id) {
      const api = useIpc()
      this.selectedTask = await api.getTask(id)
    },

    closeTask() {
      this.selectedTask = null
    },

    async createTask(data) {
      const api = useIpc()
      const task = await api.createTask(data)
      const col = this.columns.find(c => c.id === task.column_id)
      if (col) col.tasks.push(task)
      return task
    },

    async updateTask(id, data) {
      const api = useIpc()
      const updated = await api.updateTask(id, data)
      if (this.selectedTask?.id === id) this.selectedTask = updated
    },

    async moveTask(taskId, newColumnId, newPosition) {
      const api = useIpc()
      await api.moveTask(taskId, { newColumnId, newPosition })
      // Optimistic update is handled by vue-draggable-plus
      // Full refetch only if needed
    },

    async deleteTask(id) {
      const api = useIpc()
      await api.deleteTask(id)
      this.columns = this.columns.map(col => ({
        ...col,
        tasks: col.tasks.filter(t => t.id !== id)
      }))
      if (this.selectedTask?.id === id) this.selectedTask = null
    }
  }
})
```

---

### `uiStore.js`
```js
import { defineStore } from 'pinia'

export const useUiStore = defineStore('ui', {
  state: () => ({
    theme: 'dark',         // 'dark' | 'light' | future themes
    sidebarCollapsed: false
  }),

  actions: {
    async initTheme() {
      const api = window.electronAPI
      const saved = await api.getSetting('theme')
      this.theme = saved || 'dark'
      this.applyTheme(this.theme)
    },

    async setTheme(theme) {
      this.theme = theme
      this.applyTheme(theme)
      await window.electronAPI.setSetting('theme', theme)
    },

    applyTheme(theme) {
      document.documentElement.setAttribute('data-theme', theme)
    }
  }
})
```

---

## Layout

**`src/layouts/MainLayout.vue`** — structural overview
```vue
<template>
  <q-layout view="lHh Lpr lFf">

    <!-- Narrow icon sidebar -->
    <q-drawer :width="64" :breakpoint="0" show-if-above>
      <AppSidebar />
    </q-drawer>

    <!-- Main content area -->
    <q-page-container>
      <router-view />
    </q-page-container>

  </q-layout>
</template>
```

---

## Pages

### `DashboardPage.vue`
- On mount: calls `projectsStore.fetchProjects()`
- Renders grid of `ProjectCard` components
- Has "New Project" button that opens `NewProjectModal`
- Sections: Active projects, Paused, Completed (or filtered tabs)

### `ProjectBoardPage.vue`
- On mount: calls `tasksStore.fetchBoard(route.params.id)`
- Renders `KanbanBoard` component
- Clicking a task card opens `TaskDetailModal`
- Has project header with name, color, logo, status actions

### `SettingsPage.vue`
- Theme toggle section
- Category management (list, add, edit, delete)
- App info (version, data location)

---

## Key Components

### `KanbanBoard.vue`
```
- Renders columns in order (sorted by position)
- Uses vue-draggable-plus for horizontal column drag (optional)
- Passes column data down to KanbanColumn
- Has "Add Column" button at the end
```

### `KanbanColumn.vue`
```
- Receives column data as prop
- Uses vue-draggable-plus for vertical task drag within column
- Handles cross-column drag via shared group name
- On drag end: calls tasksStore.moveTask(taskId, newColumnId, newPosition)
- Has "Add Task" inline form at bottom
```

### `TaskCard.vue`
```
- Displays: title, priority badge (if set), due date (if set)
- Icons: paperclip if has attachments, checklist if has subtasks
- Click: opens TaskDetailModal
```

### `TaskDetailModal.vue`
```
- q-dialog with maximized or near-fullscreen size
- Left panel (70%): title (editable inline), description, subtask list, attachments
- Right panel (30%): column selector, priority, due date, timestamps
- Subtask: checkbox + text, add new inline
- Attachments: list with open/delete, "Add File" button triggers file picker
```

### `NewProjectModal.vue`
```
- Form: name, color picker, logo upload, category (autocomplete from existing)
- Columns section: add/remove/rename columns, set order, set done column
- Validation: name required, at least one column, exactly one done column
```

### `ProjectCard.vue`
```
- Shows: logo/color block, name, category badge, status badge
- Progress bar (thin line style)
- Stats: "X/Y tasks · Z%"
- Context menu or hover actions: pause, complete, settings, delete
- Click: navigate to project board
```
