<template>
  <div class="board-page">

    <header class="zc-board-hd" v-if="currentProject">
      <button class="zc-back" title="Back" @click="$router.push('/')">
        <ZIcon name="arrowLeft" :size="15" />
      </button>
      <div class="zc-board-logo" :style="{ background: currentProject.color }">
        <img
          v-if="currentProject.logo_path"
          :src="getLogoSrc(currentProject.logo_path)"
          style="width:100%;height:100%;object-fit:cover;border-radius:6px;"
        />
        <span v-else>{{ getInitials(currentProject) }}</span>
      </div>
      <div class="zc-board-name">{{ currentProject.name }}</div>
      <span v-if="currentProject.category_name" class="zc-badge cat">
        {{ currentProject.category_name }}
      </span>
      <div style="flex:1" />
      <button class="zc-btn secondary sm" @click="showSettings = true">
        <ZIcon name="settings" :size="13" /> Settings
      </button>
    </header>

    <div v-if="boardLoading" class="zc-board" style="padding-top:24px;">
      <div v-for="i in 3" :key="i" class="zc-col">
        <div class="zc-col-hd">
          <div style="width:80px;height:12px;background:var(--zc-surface-2);border-radius:3px;" />
        </div>
      </div>
    </div>

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

    <div v-else class="zc-board">
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
          <div class="zc-col-hd">
            <div class="zc-col-drag-handle" title="Drag to reorder">
              <ZIcon name="grip" :size="12" :stroke="1" />
            </div>

            <template v-if="editingColId === col.id">
              <input
                :ref="(el) => { if (el) colNameInputs[col.id] = el }"
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

          <TaskList
            v-model:tasks="col.tasks"
            :col-id="col.id"
            @task-click="openTaskById"
            @reorder="onDragReorder"
            @moved="onDragMoved"
          />

          <div v-if="addingInCol === col.id" class="col-add-form">
            <input
              :ref="(el) => { if (el) addTaskInputs[col.id] = el }"
              class="zc-input"
              placeholder="Task title…"
              v-model="newTaskTitle"
              @keydown.enter="doCreateTask(col)"
              @keydown.esc="cancelAddTask"
            />
            <div style="display:flex;gap:6px;margin-top:6px;">
              <button class="zc-btn primary sm" @click="doCreateTask(col)">Add</button>
              <button class="zc-btn ghost sm" @click="cancelAddTask">Cancel</button>
            </div>
          </div>
          <button v-else class="zc-col-add" @click="startAddTask(col.id)">
            <ZIcon name="plus" :size="13" /> Add task
          </button>

        </div>
      </VueDraggable>

      <div v-if="addingCol" class="add-col-form">
        <input
          ref="addColInput"
          class="zc-input"
          placeholder="Column name…"
          v-model="newColName"
          @keydown.enter="doCreateColumn"
          @keydown.esc="addingCol = false"
        />
        <label class="add-col-done-label" @click="newColDone = !newColDone">
          <span :class="['zc-radio', newColDone ? 'active' : '']" />
          mark as done
        </label>
        <div style="display:flex;gap:6px;margin-top:8px;">
          <button class="zc-btn primary sm" @click="doCreateColumn">Add</button>
          <button class="zc-btn ghost sm" @click="addingCol = false">Cancel</button>
        </div>
      </div>
      <button v-else class="zc-add-col" @click="startAddCol">
        <ZIcon name="plus" :size="13" /> Add column
      </button>
    </div>

    <Teleport to="body">
      <TaskModal
        v-if="selectedTask"
        :task="selectedTask"
        :columns="columns"
        :project="currentProject"
        @close="handleClose"
        @deleted="onTaskDeleted"
        @moved="onTaskMoved"
        @updated="onTaskUpdated"
      />
    </Teleport>

    <Teleport to="body">
      <ProjectSettingsModal
        v-if="showSettings && currentProject"
        :project="currentProject"
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
import { ref, nextTick, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { VueDraggable } from 'vue-draggable-plus'
import { useProject } from 'src/domains/project/useProject'
import { useBoard }   from 'src/domains/board/useBoard'
import { useTask }    from 'src/domains/task/useTask'
import ZIcon                  from 'src/components/common/ZIcon.vue'
import TaskList               from 'src/components/board/TaskList.vue'
import TaskModal              from 'src/components/modals/TaskModal.vue'
import ProjectSettingsModal   from 'src/components/modals/ProjectSettingsModal.vue'

const route  = useRoute()
const router = useRouter()

const { currentProject, fetchProject, fetchProjects, getInitials, getLogoSrc } = useProject()
const { columns, loading: boardLoading, fetchBoard, createColumn, updateColumnName, reorderColumns, deleteColumn } = useBoard()
const { selectedTask, openTask, closeTask, createTask, moveTask } = useTask()

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

async function load() {
  const id = route.params.id
  await Promise.all([fetchProject(id), fetchBoard(id)])
}

onMounted(async () => {
  await load()
  if (route.query.task) {
    try { await openTask(parseInt(route.query.task)) } catch (_) {}
  }
})

async function openTaskById(taskShallow) {
  await openTask(taskShallow.id)
}

function onTaskUpdated(taskId, changes) {
  columns.value.forEach((col) => {
    const idx = col.tasks.findIndex((t) => t.id === taskId)
    if (idx !== -1) Object.assign(col.tasks[idx], changes)
  })
  if (selectedTask.value?.id === taskId) Object.assign(selectedTask.value, changes)
}

function onTaskDeleted(taskId) {
  columns.value.forEach((col) => {
    col.tasks = col.tasks.filter((t) => t.id !== taskId)
  })
}

function onTaskMoved({ taskId, fromColumnId, toColumnId }) {
  const fromCol = columns.value.find((c) => c.id === fromColumnId)
  const toCol   = columns.value.find((c) => c.id === toColumnId)
  if (!fromCol || !toCol) return
  const idx = fromCol.tasks.findIndex((t) => t.id === taskId)
  if (idx === -1) return
  const [task] = fromCol.tasks.splice(idx, 1)
  task.column_id = toColumnId
  toCol.tasks.unshift(task)
  if (selectedTask.value?.id === taskId) {
    selectedTask.value = { ...selectedTask.value, column_id: toColumnId }
  }
}

function handleClose() {
  closeTask()
  if (route.query.task) router.replace({ name: 'project-board', params: route.params })
}


function startAddTask(colId) {
  addingInCol.value  = colId
  newTaskTitle.value = ''
  nextTick(() => addTaskInputs[colId]?.focus())
}

function cancelAddTask() {
  addingInCol.value  = null
  newTaskTitle.value = ''
}

async function doCreateTask(col) {
  if (!newTaskTitle.value.trim()) return
  const task = await createTask({
    project_id: route.params.id,
    column_id:  col.id,
    title:      newTaskTitle.value.trim(),
  })
  col.tasks.push({ ...task, subtask_count: 0, subtask_done: 0, attachment_count: 0 })
  newTaskTitle.value = ''
  nextTick(() => addTaskInputs[col.id]?.focus())
}

function onDragReorder({ colId, newIndex }) {
  const col = columns.value.find((c) => c.id === colId)
  if (!col) return
  const task = col.tasks[newIndex]
  if (task) moveTask(task.id, { newColumnId: colId, newPosition: newIndex })
}

function onDragMoved({ taskId, fromColId, toColId, newIndex }) {
  const toCol = columns.value.find((c) => c.id === toColId)
  if (!toCol) return
  const task = toCol.tasks[newIndex]
  if (!task) return
  task.column_id = toColId
  if (selectedTask.value?.id === taskId) {
    selectedTask.value = { ...selectedTask.value, column_id: toColId }
  }
  moveTask(taskId, { newColumnId: toColId, newPosition: newIndex })
}

function onColReorder() {
  reorderColumns(route.params.id)
}

function startEditCol(col) {
  editingColId.value = col.id
  nextTick(() => colNameInputs[col.id]?.focus())
}

async function saveColName(col, name) {
  editingColId.value = null
  await updateColumnName(col, name)
}

function startAddCol() {
  addingCol.value  = true
  newColName.value = ''
  newColDone.value = false
  nextTick(() => addColInput.value?.focus())
}

async function doCreateColumn() {
  if (!newColName.value.trim()) return
  await createColumn({
    project_id:     route.params.id,
    name:           newColName.value.trim(),
    position:       columns.value.length,
    is_done_column: newColDone.value ? 1 : 0,
  })
  newColName.value = ''
  newColDone.value = false
  addingCol.value  = false
}

async function onProjectUpdated() {
  await Promise.all([
    fetchProject(route.params.id),
    fetchProjects(),
  ])
}

function onProjectDeleted() {
  router.push('/')
}

async function onColumnsChanged() {
  await fetchBoard(route.params.id)
}
</script>

<style scoped>
.board-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 36px);
  background: var(--zc-bg);
  overflow: hidden;
}

:global(.tcard-ghost) {
  opacity: 0.4;
  background: var(--zc-surface-2) !important;
  border: 1px dashed var(--zc-accent) !important;
}

:global(.col-ghost) {
  opacity: 0.35;
  background: var(--zc-surface) !important;
  border: 1px dashed var(--zc-accent) !important;
}

:deep(.zc-board-draggable) {
  display: flex;
  gap: 14px;
  align-items: stretch;
  flex-shrink: 0;
}

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

.col-add-form { padding: 6px 4px 8px; }

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
