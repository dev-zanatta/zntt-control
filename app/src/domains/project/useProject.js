import { ref, computed } from 'vue'
import { ProjectService } from './project.service'
import { Project } from './project.entity'

export function useProject() {
  const projects        = ref([])
  const currentProject  = ref(null)
  const loading         = ref(false)

  const activeProjects    = computed(() => projects.value.filter((p) => p.status === 'active'))
  const pausedProjects    = computed(() => projects.value.filter((p) => p.status === 'paused'))
  const completedProjects = computed(() => projects.value.filter((p) => p.status === 'completed'))

  async function fetchProjects() {
    loading.value = true
    try {
      projects.value = await ProjectService.getAll()
    } finally {
      loading.value = false
    }
  }

  async function fetchProject(id) {
    currentProject.value = await ProjectService.getById(id)
    return currentProject.value
  }

  async function createProject(data) {
    const project = await ProjectService.create(data)
    projects.value.unshift(project)
    return project
  }

  async function updateProject(id, data, newLogoPath) {
    const updated = await ProjectService.updateWithLogo(id, data, newLogoPath)
    const idx = projects.value.findIndex((p) => p.id === id)
    if (idx !== -1) projects.value[idx] = updated
    if (currentProject.value?.id === id) currentProject.value = updated
    return updated
  }

  async function updateProjectStatus(id, status) {
    const updated = await ProjectService.updateStatus(id, status)
    const idx = projects.value.findIndex((p) => p.id === id)
    if (idx !== -1) projects.value[idx] = updated
    return updated
  }

  async function deleteProject(id) {
    await ProjectService.delete(id)
    projects.value = projects.value.filter((p) => p.id !== id)
    if (currentProject.value?.id === id) currentProject.value = null
  }

  return {
    projects,
    currentProject,
    loading,
    activeProjects,
    pausedProjects,
    completedProjects,
    fetchProjects,
    fetchProject,
    createProject,
    updateProject,
    updateProjectStatus,
    deleteProject,
    getProgress: Project.progress,
    getInitials: Project.initials,
    getLogoSrc:  Project.logoSrc,
  }
}
