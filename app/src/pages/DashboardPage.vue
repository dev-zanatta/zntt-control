<template>
  <q-page class="dash-page">
    <header class="zc-page-hd">
      <div>
        <h1 class="zc-page-title">Projects</h1>
        <p class="zc-page-sub">{{ store.projects.length }} projects · {{ stats.active }} active</p>
      </div>
      <button class="zc-btn secondary" @click="showImportModal = true">
        <ZIcon name="download" :size="14" />
        Import from Trello
      </button>
      <button class="zc-btn primary" @click="showNewModal = true">
        <ZIcon name="plus" :size="14" />
        New Project
      </button>
    </header>

    <div class="zc-dash-body">
      <div class="zc-dash-summary">
        <div class="zc-dash-stat">
          <span class="zc-dash-stat-val">{{ store.projects.length }}</span>
          <span class="zc-dash-stat-lab">projects</span>
        </div>
        <div class="zc-dash-stat">
          <span class="zc-dash-stat-val">{{ stats.active }}</span>
          <span class="zc-dash-stat-lab">active</span>
        </div>
        <div class="zc-dash-stat">
          <span class="zc-dash-stat-val">
            {{ stats.doneTasks }}<span style="color: var(--zc-text-faint)">/{{ stats.totalTasks }}</span>
          </span>
          <span class="zc-dash-stat-lab">tasks done</span>
        </div>
        <div style="flex: 1" />
        <div class="zc-dash-filters">
          <button
            v-for="f in filters"
            :key="f"
            :class="['zc-chip', activeFilter === f ? 'active' : '']"
            @click="activeFilter = f"
          >
            {{ f }}
          </button>
        </div>
      </div>

      <template v-if="store.projects.length === 0 && !store.loading">
        <div class="zc-empty">
          <div class="zc-empty-icon">
            <ZIcon name="folder" :size="28" :stroke="1.4" />
          </div>
          <div class="zc-empty-title">No projects yet</div>
          <p class="zc-empty-sub">
            Crie seu primeiro projeto para começar a organizar tarefas em um quadro Kanban.
            Tudo fica salvo localmente.
          </p>
          <div class="zc-empty-cta">
            <button class="zc-btn primary lg" @click="showNewModal = true">
              <ZIcon name="plus" :size="15" />
              Create project
            </button>
          </div>
        </div>
      </template>

      <div v-else class="zc-dash-grid">
        <ProjectCard
          v-for="project in filteredProjects"
          :key="project.id"
          :project="project"
          @click="openProject(project)"
          @toggle-status="toggleStatus(project)"
          @delete="confirmDelete(project)"
          @settings="openSettings(project)"
        />
      </div>
    </div>

    <Teleport to="body">
      <NewProjectModal
        v-if="showNewModal"
        :existing-categories="categories"
        @close="showNewModal = false"
        @created="onProjectCreated"
      />

      <ImportTrelloModal
        v-if="showImportModal"
        @close="showImportModal = false"
        @imported="onImported"
      />

      <div v-if="pendingDelete" class="zc-modal-overlay zc-fade" @click="pendingDelete = null">
        <div class="zc-modal" style="max-width: 360px;" @click.stop>
          <div class="zc-modal-hd">
            <div class="zc-modal-title">Delete project?</div>
            <button class="zc-modal-x" @click="pendingDelete = null">
              <ZIcon name="x" :size="14" />
            </button>
          </div>
          <div class="zc-modal-body" style="padding: 16px 18px; font-size: 13px; color: var(--zc-text-dim);">
            "<strong style="color: var(--zc-text);">{{ pendingDelete.name }}</strong>" and all its tasks will be permanently deleted.
          </div>
          <div class="zc-modal-ft">
            <button class="zc-btn ghost" @click="pendingDelete = null">Cancel</button>
            <button class="zc-btn danger" @click="doDelete">Delete</button>
          </div>
        </div>
      </div>
    </Teleport>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectsStore } from 'src/stores/projectsStore'
import { useIpc } from 'src/composables/useIpc'
import ZIcon from 'src/components/common/ZIcon.vue'
import ProjectCard from 'src/components/dashboard/ProjectCard.vue'
import NewProjectModal from 'src/components/modals/NewProjectModal.vue'
import ImportTrelloModal from 'src/components/modals/ImportTrelloModal.vue'

const router = useRouter()
const store = useProjectsStore()
const api = useIpc()

const showNewModal    = ref(false)
const showImportModal = ref(false)
const pendingDelete   = ref(null)
const categories = ref([])
const activeFilter = ref('all')

const stats = computed(() => {
  const active = store.projects.filter(p => p.status === 'active').length
  const totalTasks = store.projects.reduce((s, p) => s + (p.total_tasks || 0), 0)
  const doneTasks = store.projects.reduce((s, p) => s + (p.done_tasks || 0), 0)
  return { active, totalTasks, doneTasks }
})

const filters = computed(() => {
  const cats = [...new Set(
    store.projects
      .filter(p => p.category_name)
      .map(p => p.category_name)
  )]
  const hasPaused = store.projects.some(p => p.status === 'paused')
  return ['all', ...cats, ...(hasPaused ? ['paused'] : [])]
})

const filteredProjects = computed(() => {
  if (activeFilter.value === 'all') return store.projects
  if (activeFilter.value === 'paused') return store.projects.filter(p => p.status === 'paused')
  return store.projects.filter(p => p.category_name === activeFilter.value)
})

async function loadData() {
  await store.fetchProjects()
  categories.value = await api.getCategories()
}

function openProject(project) {
  router.push(`/project/${project.id}`)
}

function openSettings(project) {
  router.push(`/project/${project.id}`)
}

async function toggleStatus(project) {
  const newStatus = project.status === 'paused' ? 'active' : 'paused'
  await store.updateProjectStatus(project.id, newStatus)
}

function confirmDelete(project) {
  pendingDelete.value = project
}

async function doDelete() {
  if (!pendingDelete.value) return
  await store.deleteProject(pendingDelete.value.id)
  pendingDelete.value = null
}

function onProjectCreated(project) {
  store.projects.unshift(project)
  showNewModal.value = false
  router.push(`/project/${project.id}`)
}

async function onImported() {
  // Refresh project list; navigation and modal close are handled by the modal itself
  await store.fetchProjects()
}

onMounted(loadData)
</script>

<style scoped>
.dash-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--zc-bg);
}

.zc-dash-body {
  display: flex;
  flex-direction: column;
}
</style>
