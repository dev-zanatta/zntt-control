<template>
  <div class="zc-modal-overlay zc-fade" @click="$emit('close')">
    <div class="zc-modal zc-modal--lg" @click.stop>

      <div class="zc-modal-hd">
        <button class="zc-modal-x" @click="$emit('close')">
          <ZIcon name="x" :size="14" />
        </button>
        <div class="zc-modal-title" style="font-family:var(--zc-mono);font-size:11px;color:var(--zc-text-dim);">
          TASK · #{{ task.id }}
        </div>
        <button class="zc-btn danger sm" @click="confirmDelete">
          <ZIcon name="trash" :size="12" /> Delete
        </button>
      </div>

      <div class="zc-modal-body">
        <div class="zc-task-body">

          <div class="zc-task-main">
            <input
              ref="titleRef"
              v-model="localTitle"
              class="zc-task-title-input"
              placeholder="Task title…"
              @blur="saveTitle"
              @keydown.enter="titleRef?.blur()"
            />

            <textarea
              v-model="localDesc"
              class="zc-textarea"
              style="min-height: 100px;"
              placeholder="Add a description…"
              @blur="saveDesc"
            />

            <div class="zc-task-section">
              <div class="zc-task-section-h">
                Subtasks
                <span style="font-family:var(--zc-mono);color:var(--zc-text-faint);">
                  {{ doneSubtasksCount }}/{{ localSubtasks.length }}
                </span>
              </div>

              <div
                v-for="st in localSubtasks"
                :key="st.id"
                :class="['zc-subtask', st.completed ? 'done' : '']"
                @click="doToggleSubtask(st)"
              >
                <span :class="['zc-check', st.completed ? 'done' : '']">
                  <ZIcon v-if="st.completed" name="check" :size="11" :stroke="2.5" />
                </span>
                <span class="zc-subtask-text">{{ st.title }}</span>
                <button class="zc-btn ghost sm zc-subtask-x" @click.stop="doDeleteSubtask(st.id)">
                  <ZIcon name="x" :size="12" />
                </button>
              </div>

              <div style="display:flex;gap:6px;margin-top:8px;">
                <input
                  v-model="newSubtaskText"
                  class="zc-input"
                  placeholder="Add subtask…"
                  @keydown.enter="doAddSubtask"
                />
                <button class="zc-btn secondary" @click="doAddSubtask">Add</button>
              </div>
            </div>

            <div class="zc-task-section">
              <div class="zc-task-section-h">Attachments</div>

              <div v-for="att in localAttachments" :key="att.id" class="zc-attach">
                <ZIcon name="file" :size="14" />
                <span class="zc-attach-name">{{ att.original_name }}</span>
                <span class="zc-attach-size">{{ formatSize(att.size_bytes) }}</span>
                <div class="zc-attach-actions">
                  <button class="zc-btn ghost sm icon" title="Open" @click="doOpenAttachment(att.id)">
                    <ZIcon name="ext" :size="12" />
                  </button>
                  <button class="zc-btn ghost sm icon" title="Delete" @click="doDeleteAttachment(att.id)">
                    <ZIcon name="x" :size="12" />
                  </button>
                </div>
              </div>

              <div style="display:flex;align-items:center;gap:8px;margin-top:8px;">
                <button class="zc-btn ghost sm" @click="doAddAttachment">
                  <ZIcon name="paperclip" :size="12" /> Add file
                </button>
                <span v-if="attachError" style="font-size:11px;color:var(--zc-danger);">{{ attachError }}</span>
              </div>
            </div>
          </div>

          <aside class="zc-task-side">
            <div class="zc-meta-row">
              <span class="zc-meta-label">Project</span>
              <span class="zc-meta-value" style="font-family:var(--zc-mono);font-size:11.5px;">
                {{ project?.name }}
              </span>
            </div>

            <div class="zc-meta-row" style="position:relative;">
              <span class="zc-meta-label">Column</span>
              <span class="zc-meta-pill" @click="showColPicker = !showColPicker">
                <span class="zc-tb-dot" style="background:var(--zc-teal);" />
                {{ currentColumn?.name || '—' }}
                <ZIcon name="chevDown" :size="11" />
              </span>
              <div v-if="showColPicker" class="meta-picker" @click.stop>
                <button
                  v-for="col in columns"
                  :key="col.id"
                  :class="['meta-picker-item', task.column_id === col.id ? 'active' : '']"
                  @click="moveToColumn(col)"
                >
                  {{ col.name }}
                </button>
              </div>
            </div>

            <div class="zc-meta-row" style="position:relative;">
              <span class="zc-meta-label">Priority</span>
              <span class="zc-meta-pill" @click="showPriPicker = !showPriPicker">
                <span v-if="localPriority" class="zc-tb-dot" :style="{ background: getPriorityColor(localPriority) }" />
                {{ localPriority || 'None' }}
                <ZIcon name="chevDown" :size="11" />
              </span>
              <div v-if="showPriPicker" class="meta-picker" @click.stop>
                <button
                  v-for="p in PRIORITIES"
                  :key="String(p.val)"
                  :class="['meta-picker-item', localPriority === p.val ? 'active' : '']"
                  @click="setPriority(p.val)"
                >
                  <span class="zc-tb-dot" :style="{ background: p.color }" />
                  {{ p.label }}
                </button>
              </div>
            </div>

            <div class="zc-meta-row">
              <span class="zc-meta-label">Due date</span>
              <input
                type="date"
                class="meta-date-input"
                :value="localDue"
                @change="setDueDate($event.target.value)"
              />
            </div>

            <div class="zc-meta-row">
              <span class="zc-meta-label">Created</span>
              <span class="zc-meta-value" style="font-family:var(--zc-mono);font-size:11px;color:var(--zc-text-dim);">
                {{ formattedCreated }}
              </span>
            </div>

            <div class="zc-meta-row">
              <span class="zc-meta-label">Task ID</span>
              <span class="zc-meta-value" style="font-family:var(--zc-mono);font-size:11px;color:var(--zc-text-dim);">
                #{{ task.id }}
              </span>
            </div>
          </aside>
        </div>
      </div>
    </div>
  </div>

  <div v-if="pendingDelete" class="zc-modal-overlay" style="z-index:6001;" @click="pendingDelete = false">
    <div class="zc-modal" style="max-width:320px;" @click.stop>
      <div class="zc-modal-hd">
        <div class="zc-modal-title">Delete task?</div>
        <button class="zc-modal-x" @click="pendingDelete = false">
          <ZIcon name="x" :size="14" />
        </button>
      </div>
      <div class="zc-modal-body" style="padding:16px 18px;font-size:13px;color:var(--zc-text-dim);">
        This action cannot be undone.
      </div>
      <div class="zc-modal-ft">
        <button class="zc-btn ghost" @click="pendingDelete = false">Cancel</button>
        <button class="zc-btn danger" @click="doDelete">Delete</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import ZIcon from 'src/components/common/ZIcon.vue'
import { useTask, useSubtask, useAttachment } from 'src/domains/task/useTask'
import { useApp } from 'src/domains/app/useApp'

const props = defineProps({
  task:    { type: Object, required: true },
  columns: { type: Array, default: () => [] },
  project: { type: Object, default: null },
})

const emit = defineEmits(['close', 'deleted', 'moved', 'updated'])

const { PRIORITIES, updateTask, moveTask, deleteTask, getPriorityColor } = useTask()
const { createSubtask, toggleSubtask, deleteSubtask } = useSubtask()
const { attachError, addAttachment, deleteAttachment, formatSize } = useAttachment()
const { selectFile } = useApp()

const localTitle       = ref(props.task.title)
const localDesc        = ref(props.task.description || '')
const localPriority    = ref(props.task.priority || null)
const localDue         = ref(props.task.due_date || '')
const localSubtasks    = ref([...(props.task.subtasks || [])])
const localAttachments = ref([...(props.task.attachments || [])])

const titleRef       = ref(null)
const newSubtaskText = ref('')
const showColPicker  = ref(false)
const showPriPicker  = ref(false)
const pendingDelete  = ref(false)

const currentColumn = computed(() => props.columns.find((c) => c.id === props.task.column_id))

const doneSubtasksCount = computed(() => localSubtasks.value.filter((s) => s.completed).length)

const formattedCreated = computed(() => {
  if (!props.task.created_at) return '—'
  return new Date(props.task.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
})

async function saveTitle() {
  if (localTitle.value.trim() === props.task.title) return
  if (!localTitle.value.trim()) { localTitle.value = props.task.title; return }
  await updateTask(props.task.id, { title: localTitle.value.trim() })
  emit('updated', props.task.id, { title: localTitle.value.trim() })
}

async function saveDesc() {
  if (localDesc.value === (props.task.description || '')) return
  await updateTask(props.task.id, { description: localDesc.value })
  emit('updated', props.task.id, { description: localDesc.value })
}

async function doToggleSubtask(st) {
  const updated = await toggleSubtask(st.id)
  const idx = localSubtasks.value.findIndex((s) => s.id === st.id)
  if (idx !== -1) localSubtasks.value[idx] = updated
}

async function doAddSubtask() {
  if (!newSubtaskText.value.trim()) return
  const st = await createSubtask({ task_id: props.task.id, title: newSubtaskText.value.trim() })
  localSubtasks.value.push(st)
  newSubtaskText.value = ''
}

async function doDeleteSubtask(id) {
  await deleteSubtask(id)
  localSubtasks.value = localSubtasks.value.filter((s) => s.id !== id)
}

async function doAddAttachment() {
  const att = await addAttachment(props.task.id, selectFile)
  if (att) localAttachments.value.push(att)
}

function doOpenAttachment(id) {
  const att = localAttachments.value.find((a) => a.id === id)
  if (att?.url) window.open(att.url, '_blank')
}

async function doDeleteAttachment(id) {
  await deleteAttachment(id)
  localAttachments.value = localAttachments.value.filter((a) => a.id !== id)
}

async function moveToColumn(col) {
  if (col.id === props.task.column_id) { showColPicker.value = false; return }
  await moveTask(props.task.id, { newColumnId: col.id, newPosition: 0 })
  emit('moved', { taskId: props.task.id, fromColumnId: props.task.column_id, toColumnId: col.id })
  showColPicker.value = false
}

async function setPriority(val) {
  localPriority.value = val
  await updateTask(props.task.id, { priority: val })
  emit('updated', props.task.id, { priority: val })
  showPriPicker.value = false
}

async function setDueDate(val) {
  localDue.value = val
  await updateTask(props.task.id, { due_date: val || null })
  emit('updated', props.task.id, { due_date: val || null })
}

function confirmDelete() { pendingDelete.value = true }
async function doDelete() {
  await deleteTask(props.task.id)
  emit('deleted', props.task.id)
}

function handleOutsideClick(e) {
  if (!e.target.closest('.meta-picker') && !e.target.closest('.zc-meta-pill')) {
    showColPicker.value = false
    showPriPicker.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleOutsideClick)
  titleRef.value?.focus()
})
onBeforeUnmount(() => {
  document.removeEventListener('click', handleOutsideClick)
})
</script>

<style scoped>
.meta-picker {
  position: absolute;
  right: 0;
  top: calc(100% + 4px);
  min-width: 140px;
  background: var(--zc-surface-2);
  border: 1px solid var(--zc-border-strong);
  border-radius: var(--zc-r);
  box-shadow: 0 8px 20px rgba(0,0,0,0.4);
  z-index: 10;
  overflow: hidden;
}
.meta-picker-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 7px 12px;
  background: transparent;
  border: 0;
  color: var(--zc-text);
  font: inherit;
  font-size: 12.5px;
  cursor: pointer;
  text-align: left;
}
.meta-picker-item:hover { background: var(--zc-hover); }
.meta-picker-item.active { color: var(--zc-accent); }

.meta-date-input {
  background: var(--zc-surface);
  border: 1px solid var(--zc-border);
  border-radius: var(--zc-r-sm);
  color: var(--zc-text);
  font: inherit;
  font-size: 12px;
  padding: 3px 6px;
  outline: none;
  cursor: pointer;
}
.meta-date-input:focus { border-color: var(--zc-accent); }
.meta-date-input::-webkit-calendar-picker-indicator { filter: invert(0.7); cursor: pointer; }

.zc-tb-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
</style>
