import { defineStore } from 'pinia'
import { useIpc } from 'src/composables/useIpc'

export const useProjectsStore = defineStore('projects', {
  state: () => ({
    projects: [],
    currentProject: null,
    loading: false,
  }),

  getters: {
    activeProjects: (state) => state.projects.filter((p) => p.status === 'active'),
    pausedProjects: (state) => state.projects.filter((p) => p.status === 'paused'),
    completedProjects: (state) => state.projects.filter((p) => p.status === 'completed'),

    projectProgress: (state) => (projectId) => {
      const p = state.projects.find((p) => p.id === projectId)
      if (!p || p.total_tasks === 0) return 0
      return Math.round((p.done_tasks / p.total_tasks) * 100)
    },
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
      const idx = this.projects.findIndex((p) => p.id === id)
      if (idx !== -1) this.projects[idx] = updated
      if (this.currentProject?.id === id) this.currentProject = updated
    },

    async updateProjectStatus(id, status) {
      const api = useIpc()
      const updated = await api.updateProjectStatus(id, status)
      const idx = this.projects.findIndex((p) => p.id === id)
      if (idx !== -1) this.projects[idx] = updated
    },

    async deleteProject(id) {
      const api = useIpc()
      await api.deleteProject(id)
      this.projects = this.projects.filter((p) => p.id !== id)
    },
  },
})
