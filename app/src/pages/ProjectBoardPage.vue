<template>
  <div class="board-page">

    <!-- Header -->
    <header class="zc-board-hd" v-if="project">
      <button class="zc-back" title="Back" @click="$router.push('/')">
        <ZIcon name="arrowLeft" :size="15" />
      </button>
      <div class="zc-board-logo" :style="{ background: project.color }">
        <img
          v-if="project.logo_path"
          :src="/^[A-Za-z]:/.test(project.logo_path) || project.logo_path.startsWith('/') ? `file:///${project.logo_path.replaceAll('\\', '/')}` : `zntt-userdata://${project.logo_path}`"
          style="width:100%;height:100%;object-fit:cover;border-radius:6px;"
        />
        <span v-else>{{ initials }}</span>
      </div>  
      <div class="zc-board-name">{{ project.name }}</div>
      <span v-if="project.category_name" class="zc-badge cat">
        {{ project.category_name }}
      </span>
      <div style="flex:1" />
      <button class="zc-btn secondary sm" @click="showSettings = true">
        <ZIcon name="settings" :size="13" /> Settings
      </button>
    </header>

    <!-- Loading skeleton -->
    <div v-if="loading" class="zc-board" style="padding-top:24px;">
      <div v-for="i in 3" :key="i" class="zc-col">
        <div class="zc-col-hd">
          <div style="width:80px;height:12px;background:var(--zc-surface-2);border-radius:3px;" />
        </div>
      </div>
    </div>

    <!-- Empty board — only while not in the middle of adding the first column -->
    <div v-else-if="columns.length === 0 && !addingCol" class="zc-empty">
      <div class="zc-empty-icon"><ZIcon name="checklist" :size="28" :stroke="1.4" /></div>
      <div class="zc-empty-title">No columns yet</div>
      <p class="zc-empty-sub">Add columns to organize your tasks (Backlog, Doing, Done…)</p>
      <div class="zc-empty-cta">
        <button class="zc-btn primary lg" @click="startAddCol">
          <ZIcon name="plus" :size="15" /> Add first column
        </button>
      </div>
    </div>

    <!-- Kanban board -->
    <div v-else class="zc-board">

      <!-- Draggable columns wrapper -->
      <!--
        IMPORTANT: use v-for in the default slot (not #item scoped slot).
        vue-draggable-plus v0.3.x renders a Fragment (no root element) when #item
        is used, making vnode.el === null and crashing SortableJS on mount.
      -->
      <VueDraggable
        v-model="columns"
        class="zc-board-draggable"
        handle=".zc-col-drag-handle"
        ghost-class="col-ghost"
        :animation="150"
        @end="onColReorder"
      >
        <div
          v-for="col in columns"
          :key="col.id"
          :class="['zc-col', col.is_done_column ? 'done' : '']"
        >

          <!-- Column header -->
          <div class="zc-col-hd">
            <!-- Drag handle -->
            <div class="zc-col-drag-handle" title="Drag to reorder">
              <ZIcon name="grip" :size="12" :stroke="1" />
            </div>

            <template v-if="editingColId === col.id">
              <input
                :ref="el => { if (el) colNameInputs[col.id] = el }"
                class="zc-input"
                style="height:26px;padding:0 6px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.02em;flex:1;"
                :value="col.name"
                @blur="saveColName(col, $event.target.value)"
                @keydown.enter="saveColName(col, $event.target.value)"
                @keydown.esc="editingColId = null"
              />
            </template>
            <template v-else>
              <span
                class="zc-col-name"
                style="cursor:pointer;"
                title="Double-click to rename"
                @dblclick="startEditCol(col)"
              >{{ col.name }}</span>
            </template>

            <span class="zc-col-count">{{ col.tasks.length }}</span>
          </div>

          <!-- Task list (SortableJS-backed for reliable cross-column drag) -->
          <TaskList
            :tasks="col.tasks"
            :col-id="col.id"
            @task-click="openTask"
            @reorder="onDragReorder"
            @moved="onDragMoved"
          />

          <!-- Add task inline -->
          <div v-if="addingInCol === col.id" class="col-add-form">
            <input
              :ref="el => { if (el) addTaskInputs[col.id] = el }"
              class="zc-input"
              placeholder="Task title…"
              v-model="newTaskTitle"
              @keydown.enter="createTask(col)"
              @keydown.esc="cancelAddTask"
            />
            <div style="display:flex;gap:6px;margin-top:6px;">
              <button class="zc-btn primary sm" @click="createTask(col)">Add</button>
              <button class="zc-btn ghost sm" @click="cancelAddTask">Cancel</button>
            </div>
          </div>
          <button v-else class="zc-col-add" @click="startAddTask(col.id)">
            <ZIcon name="plus" :size="13" /> Add task
          </button>

        </div>
      </VueDraggable>

      <!-- Add column button / form -->
      <div v-if="addingCol" class="add-col-form">
        <input
          ref="addColInput"
          class="zc-input"
          placeholder="Column name…"
          v-model="newColName"
          @keydown.enter="createColumn"
          @keydown.esc="addingCol = false"
        />
        <label class="add-col-done-label" @click="newColDone = !newColDone">
          <span :class="['zc-radio', newColDone ? 'active' : '']" />
          mark as done
        </label>
        <div style="display:flex;gap:6px;margin-top:8px;">
          <button class="zc-btn primary sm" @click="createColumn">Add</button>
          <button class="zc-btn ghost sm" @click="addingCol = false">Cancel</button>
        </div>
      </div>
      <button v-else class="zc-add-col" @click="startAddCol">
        <ZIcon name="plus" :size="13" /> Add column
      </button>

    </div>

    <!-- Task Modal -->
    <Teleport to="body">
      <TaskModal
        v-if="selectedTask"
        :task="selectedTask"
        :columns="columns"
        :project="project"
        @close="closeTask"
        @deleted="onTaskDeleted"
        @moved="onTaskMoved"
        @updated="onTaskUpdated"
      />
    </Teleport>

    <!-- Project Settings Modal -->
    <Teleport to="body">
      <ProjectSettingsModal
        v-if="showSettings && project"
        :project="project"
        :columns="columns"
        @close="showSettings = false"
        @updated="onProjectUpdated"
        @deleted="onProjectDeleted"
        @columnsChanged="onColumnsChanged"
      />
    </Teleport>

  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, watch, onErrorCaptured } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { VueDraggable } from 'vue-draggable-plus'
import { useProjectsStore } from 'src/stores/projectsStore'
import { useIpc } from 'src/composables/useIpc'
import ZIcon from 'src/components/common/ZIcon.vue'
import TaskCard from 'src/components/board/TaskCard.vue'
import TaskList from 'src/components/board/TaskList.vue'
import TaskModal from 'src/components/modals/TaskModal.vue'
import ProjectSettingsModal from 'src/components/modals/ProjectSettingsModal.vue'

const route  = useRoute()
const router = useRouter()
const projectsStore = useProjectsStore()
const api = useIpc()

const project      = ref(null)
const columns      = ref([])
const loading      = ref(true)
const selectedTask = ref(null)
const showSettings = ref(false)

const addingInCol   = ref(null)
const newTaskTitle  = ref('')
const addTaskInputs = {}

const editingColId  = ref(null)
const colNameInputs = {}

const addingCol  = ref(false)
const newColName = ref('')
const newColDone = ref(false)
const addColInput = ref(null)

const initials = computed(() =>
  (project.value?.name || 'P').slice(0, 2).toUpperCase()
)

// ── Load ───────────────────────────────────────────────────────────────────
async function load() {
  loading.value = true
  const id = parseInt(route.params.id)
  try {
    const [proj, board] = await Promise.all([
      api.getProject(id),
      api.getTasksByProject(id),
    ])
    project.value  = proj
    columns.value  = board.map(col => ({ ...col, tasks: col.tasks || [] }))
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await load()
  // Open task from search (query param ?task=id)
  if (route.query.task) {
    try {
      selectedTask.value = await api.getTask(parseInt(route.query.task))
    } catch (_) {}
  }
})

watch(selectedTask, (val) => {
  console.log('[zntt] selectedTask mudou:', val ? `task id=${val.id} título="${val.title}"` : val)
  console.log('[zntt] TaskModal vai montar (v-if)?', !!val)
})

onErrorCaptured((err, instance, info) => {
  console.error('[zntt] ERRO capturado no ProjectBoardPage:', err)
  console.error('[zntt] componente:', instance?.$options?.name || instance?.$.type?.name || '?')
  console.error('[zntt] info:', info)
  return false
})

// ── Task operations ────────────────────────────────────────────────────────
async function openTask(taskShallow) {
  console.log('[zntt] openTask: chamado com taskShallow =', JSON.stringify(taskShallow))
  console.log('[zntt] openTask: taskShallow.id =', taskShallow?.id, 'tipo:', typeof taskShallow?.id)
  try {
    const task = await api.getTask(taskShallow.id)
    console.log('[zntt] openTask: api.getTask retornou =', JSON.stringify(task))
    console.log('[zntt] openTask: task é null?', task === null, '| undefined?', task === undefined)
    selectedTask.value = task
    console.log('[zntt] openTask: selectedTask.value definido, truthy?', !!selectedTask.value)
  } catch (err) {
    console.error('[zntt] openTask: ERRO ao chamar api.getTask:', err)
  }
}

function closeTask() {
  selectedTask.value = null
  // Clear query param if came from search
  if (route.query.task) {
    router.replace({ name: 'project-board', params: route.params })
  }
}

function onTaskUpdated(taskId, changes) {
  columns.value.forEach(col => {
    const idx = col.tasks.findIndex(t => t.id === taskId)
    if (idx !== -1) Object.assign(col.tasks[idx], changes)
  })
  if (selectedTask.value?.id === taskId) {
    Object.assign(selectedTask.value, changes)
  }
}

function onTaskDeleted(taskId) {
  columns.value.forEach(col => {
    col.tasks = col.tasks.filter(t => t.id !== taskId)
  })
  selectedTask.value = null
}

function onTaskMoved({ taskId, fromColumnId, toColumnId }) {
  const fromCol = columns.value.find(c => c.id === fromColumnId)
  const toCol   = columns.value.find(c => c.id === toColumnId)
  if (!fromCol || !toCol) return
  const idx = fromCol.tasks.findIndex(t => t.id === taskId)
  if (idx === -1) return
  const [task] = fromCol.tasks.splice(idx, 1)
  task.column_id = toColumnId
  toCol.tasks.unshift(task)
  if (selectedTask.value?.id === taskId) {
    selectedTask.value = { ...selectedTask.value, column_id: toColumnId }
  }
}

// ── Add task ───────────────────────────────────────────────────────────────
function startAddTask(colId) {
  addingInCol.value = colId
  newTaskTitle.value = ''
  nextTick(() => addTaskInputs[colId]?.focus())
}

function cancelAddTask() {
  addingInCol.value  = null
  newTaskTitle.value = ''
}

async function createTask(col) {
  if (!newTaskTitle.value.trim()) return
  const task = await api.createTask({
    project_id: parseInt(route.params.id),
    column_id:  col.id,
    title:      newTaskTitle.value.trim(),
  })
  col.tasks.push({ ...task, subtask_count: 0, subtask_done: 0, attachment_count: 0 })
  newTaskTitle.value = ''
  nextTick(() => addTaskInputs[col.id]?.focus())
}

// ── Task drag & drop (SortableJS events from TaskList) ────────────────────
function onDragReorder({ colId, oldIndex, newIndex }) {
  const col = columns.value.find(c => c.id === colId)
  if (!col) return
  // Move item in the reactive array to match what SortableJS already did in DOM
  const [task] = col.tasks.splice(oldIndex, 1)
  col.tasks.splice(newIndex, 0, task)
  api.moveTask(task.id, { newColumnId: colId, newPosition: newIndex })
}

function onDragMoved({ taskId, fromColId, toColId, newIndex }) {
  const fromCol = columns.value.find(c => c.id === fromColId)
  const toCol   = columns.value.find(c => c.id === toColId)
  if (!fromCol || !toCol) return
  const idx = fromCol.tasks.findIndex(t => t.id === taskId)
  if (idx === -1) return
  const [task] = fromCol.tasks.splice(idx, 1)
  task.column_id = toColId
  toCol.tasks.splice(newIndex, 0, task)
  if (selectedTask.value?.id === taskId) {
    selectedTask.value = { ...selectedTask.value, column_id: toColId }
  }
  api.moveTask(taskId, { newColumnId: toColId, newPosition: newIndex })
}

// ── Column drag reorder ────────────────────────────────────────────────────
function onColReorder() {
  const ids = columns.value.map(c => c.id)
  api.reorderColumns(parseInt(route.params.id), ids)
}

// ── Column inline rename ───────────────────────────────────────────────────
function startEditCol(col) {
  editingColId.value = col.id
  nextTick(() => colNameInputs[col.id]?.focus())
}

async function saveColName(col, name) {
  editingColId.value = null
  const trimmed = name.trim()
  if (!trimmed || trimmed === col.name) return
  await api.updateColumn(col.id, { name: trimmed })
  col.name = trimmed
}

// ── Add column ─────────────────────────────────────────────────────────────
function startAddCol() {
  addingCol.value  = true
  newColName.value = ''
  newColDone.value = false
  nextTick(() => addColInput.value?.focus())
}

async function createColumn() {
  if (!newColName.value.trim()) return
  const col = await api.createColumn({
    project_id:    parseInt(route.params.id),
    name:          newColName.value.trim(),
    position:      columns.value.length,
    is_done_column: newColDone.value ? 1 : 0,
  })
  columns.value.push({ ...col, tasks: [] })
  newColName.value = ''
  newColDone.value = false
  addingCol.value  = false
}

// ── ProjectSettingsModal callbacks ─────────────────────────────────────────
async function onProjectUpdated() {
  project.value = await api.getProject(parseInt(route.params.id))
  // Refresh project in dashboard store
  await projectsStore.fetchProjects()
}

function onProjectDeleted() {
  router.push('/')
}

async function onColumnsChanged() {
  const id = parseInt(route.params.id)
  const board = await api.getTasksByProject(id)
  columns.value = board.map(col => ({ ...col, tasks: col.tasks || [] }))
}
</script>

<style scoped>
.board-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 36px); /* total height minus titlebar */
  background: var(--zc-bg);
  overflow: hidden;
}

/* drag ghost — task */
:global(.tcard-ghost) {
  opacity: 0.4;
  background: var(--zc-surface-2) !important;
  border: 1px dashed var(--zc-accent) !important;
}

/* drag ghost — column */
:global(.col-ghost) {
  opacity: 0.35;
  background: var(--zc-surface) !important;
  border: 1px dashed var(--zc-accent) !important;
}

/* Make VueDraggable column wrapper a flex row */
:deep(.zc-board-draggable) {
  display: flex;
  gap: 14px;
  align-items: stretch;
  flex-shrink: 0;
}

/* Column drag handle */
.zc-col-drag-handle {
  cursor: grab;
  color: var(--zc-text-faint);
  padding: 2px 4px 2px 0;
  opacity: 0;
  transition: opacity 120ms;
  flex-shrink: 0;
}
.zc-col:hover .zc-col-drag-handle { opacity: 1; }
.zc-col-drag-handle:active { cursor: grabbing; }

/* Add task form */
.col-add-form {
  padding: 6px 4px 8px;
}

/* Add column form */
.add-col-form {
  width: 220px;
  flex: 0 0 220px;
  align-self: flex-start;
  margin-top: 36px;
  background: var(--zc-surface);
  border: 1px solid var(--zc-border-strong);
  border-radius: var(--zc-r-lg);
  padding: 12px;
}

.add-col-done-label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  font-family: var(--zc-mono);
  font-size: 10.5px;
  color: var(--zc-text-dim);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  user-select: none;
}

</style>
