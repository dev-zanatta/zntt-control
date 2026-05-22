import { defineStore } from 'pinia'
import { useIpc } from 'src/composables/useIpc'

export const useTasksStore = defineStore('tasks', {
  state: () => ({
    columns: [],
    selectedTask: null,
    loading: false,
  }),

  getters: {
    tasksByColumn: (state) => (columnId) => {
      const col = state.columns.find((c) => c.id === columnId)
      return col ? [...col.tasks].sort((a, b) => a.position - b.position) : []
    },
  },

  actions: {
    async fetchBoard(projectId) {
      const api = useIpc()
      this.loading = true
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
      const col = this.columns.find((c) => c.id === task.column_id)
      if (col) col.tasks.push(task)
      return task
    },

    async updateTask(id, data) {
      const api = useIpc()
      const updated = await api.updateTask(id, data)
      if (this.selectedTask?.id === id) this.selectedTask = updated
      return updated
    },

    async moveTask(taskId, newColumnId, newPosition) {
      const api = useIpc()
      await api.moveTask(taskId, { newColumnId, newPosition })
    },

    async deleteTask(id) {
      const api = useIpc()
      await api.deleteTask(id)
      this.columns = this.columns.map((col) => ({
        ...col,
        tasks: col.tasks.filter((t) => t.id !== id),
      }))
      if (this.selectedTask?.id === id) this.selectedTask = null
    },
  },
})
