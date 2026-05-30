import { ref } from 'vue'
import { TaskService } from './task.service'
import { Attachment, PRIORITIES, Task } from './task.entity'


export function useTask() {
  const selectedTask = ref(null)
  const loading      = ref(false)

  async function openTask(id) {
    loading.value = true
    try {
      selectedTask.value = await TaskService.getById(id)
    } finally {
      loading.value = false
    }
    return selectedTask.value
  }

  function closeTask() {
    selectedTask.value = null
  }

  async function createTask(data) {
    return TaskService.create(data)
  }

  async function updateTask(id, data) {
    const updated = await TaskService.update(id, data)
    if (selectedTask.value?.id === id) Object.assign(selectedTask.value, data)
    return updated
  }

  async function moveTask(taskId, target) {
    await TaskService.move(taskId, target)
  }

  async function deleteTask(id) {
    await TaskService.delete(id)
    if (selectedTask.value?.id === id) selectedTask.value = null
  }

  return {
    selectedTask,
    loading,
    PRIORITIES,
    openTask,
    closeTask,
    createTask,
    updateTask,
    moveTask,
    deleteTask,
    getPriorityColor: Task.priorityColor,
    isOverdue:        Task.isOverdue,
  }
}

export function useSubtask() {
  async function createSubtask(data) {
    return TaskService.createSubtask(data)
  }

  async function toggleSubtask(id) {
    return TaskService.toggleSubtask(id)
  }

  async function deleteSubtask(id) {
    await TaskService.deleteSubtask(id)
  }

  return { createSubtask, toggleSubtask, deleteSubtask }
}

export function useAttachment() {
  const attachError = ref('')

  async function addAttachment(taskId, selectFileFn) {
    attachError.value = ''
    try {
      const filePath = await selectFileFn()
      if (!filePath) return null

      // Read file bytes via Tauri and create a File object for FormData
      const { readFile } = await import('@tauri-apps/plugin-fs')
      const bytes    = await readFile(filePath)
      const filename = filePath.split(/[\\/]/).pop() || 'attachment'
      const file     = new File([new Uint8Array(bytes)], filename)

      return await TaskService.addAttachment(taskId, file)
    } catch (e) {
      attachError.value = e?.message || 'Failed to attach file'
      return null
    }
  }

  async function deleteAttachment(id) {
    await TaskService.deleteAttachment(id)
  }

  return {
    attachError,
    addAttachment,
    deleteAttachment,
    formatSize: Attachment.formatSize,
  }
}

export function useTaskSearch() {
  const results = ref([])
  const loading = ref(false)
  let debounceTimer = null

  function search(query) {
    clearTimeout(debounceTimer)
    if (!query.trim()) {
      results.value = []
      return
    }
    loading.value = true
    debounceTimer = setTimeout(async () => {
      try {
        results.value = await TaskService.search(query.trim())
      } finally {
        loading.value = false
      }
    }, 160)
  }

  return { results, loading, search }
}
