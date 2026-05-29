<template>
  <div class="zc-modal-overlay zc-fade" @click.self="$emit('close')">
    <div class="zc-modal zc-modal--lg psm" @click.stop>

      <div class="zc-modal-hd">
        <div class="zc-modal-title">Project Settings</div>
        <button class="zc-modal-x" @click="$emit('close')">
          <ZIcon name="x" :size="14" />
        </button>
      </div>

      <div class="psm-tabs">
        <button
          v-for="t in TABS"
          :key="t.id"
          :class="['psm-tab', activeTab === t.id ? 'active' : '', t.danger ? 'danger' : '']"
          @click="activeTab = t.id"
        >{{ t.label }}</button>
      </div>

      <div class="zc-modal-body psm-body">

        <template v-if="activeTab === 'general'">

          <div class="psm-field">
            <label class="zc-label">Name</label>
            <input v-model="formName" class="zc-input" placeholder="Project name…" />
          </div>

          <div class="psm-field">
            <label class="zc-label">Color</label>
            <div class="psm-colors">
              <button
                v-for="c in PROJ_COLORS"
                :key="c"
                :class="['psm-color', formColor === c ? 'active' : '']"
                :style="{ background: c }"
                @click="formColor = c"
              />
            </div>
          </div>

          <div class="psm-field">
            <label class="zc-label">Logo</label>
            <div class="psm-logo-row">
              <div class="psm-logo-thumb" :style="{ background: formColor }">
                <img
                  v-if="logoPreview"
                  :src="getLogoSrc(logoPreview)"
                  style="width:100%;height:100%;object-fit:cover;border-radius:4px;"
                />
                <span v-else>{{ formInitials }}</span>
              </div>
              <button class="zc-btn ghost sm" @click="changeLogo">
                <ZIcon name="paperclip" :size="12" /> Change
              </button>
              <button v-if="logoPreview" class="zc-btn ghost sm" @click="removeLogo">
                <ZIcon name="x" :size="12" /> Remove
              </button>
            </div>
          </div>

          <div class="psm-field">
            <label class="zc-label">Category</label>
            <input
              v-model="formCategory"
              class="zc-input"
              list="psm-cat-list"
              placeholder="Type or select category…"
            />
            <datalist id="psm-cat-list">
              <option v-for="c in allCategories" :key="c.id" :value="c.name" />
            </datalist>
          </div>

        </template>

        <template v-if="activeTab === 'columns'">

          <div v-if="localCols.length === 0" class="psm-empty">No columns yet.</div>

          <div class="psm-col-list">
            <div v-for="(col, idx) in localCols" :key="col.id" class="psm-col-row">
              <div class="psm-col-arrows">
                <button class="zc-btn ghost sm icon" :disabled="idx === 0" @click="moveColUp(idx)">
                  <ZIcon name="chevUp" :size="11" />
                </button>
                <button class="zc-btn ghost sm icon" :disabled="idx === localCols.length - 1" @click="moveColDown(idx)">
                  <ZIcon name="chevDown" :size="11" />
                </button>
              </div>

              <template v-if="editingColId === col.id">
                <input
                  :ref="(el) => { if (el) colInputs[col.id] = el }"
                  class="zc-input psm-col-name-input"
                  :value="col.name"
                  @blur="saveColName(col, $event.target.value)"
                  @keydown.enter="saveColName(col, $event.target.value)"
                  @keydown.esc="editingColId = null"
                />
              </template>
              <span
                v-else
                class="psm-col-name"
                title="Double-click to rename"
                @dblclick="startEditColName(col)"
              >{{ col.name }}</span>

              <label class="psm-done-lbl" @click.prevent="doSetDoneCol(col)">
                <span :class="['zc-radio', col.is_done_column ? 'active' : '']" />
                done
              </label>

              <span v-if="col.tasks?.length > 0" class="psm-task-ct">
                {{ col.tasks.length }} task{{ col.tasks.length !== 1 ? 's' : '' }}
              </span>

              <button
                class="zc-btn ghost sm icon"
                :disabled="col.tasks?.length > 0"
                :title="col.tasks?.length > 0 ? `Cannot delete — ${col.tasks.length} task(s) inside. Move them first.` : 'Delete column'"
                @click="doDeleteCol(col)"
              >
                <ZIcon name="trash" :size="12" />
              </button>
            </div>
          </div>

          <p style="font-size:11.5px;color:var(--zc-text-faint);margin-top:12px;">
            Double-click a column name to rename it. Use arrows to reorder. Only one column can be marked as done.
          </p>

        </template>

        <template v-if="activeTab === 'danger'">
          <div class="psm-danger-box">
            <div class="psm-danger-title">
              <ZIcon name="trash" :size="14" /> Delete project
            </div>
            <p class="psm-danger-desc">
              Permanently deletes <strong>{{ project.name }}</strong>, all its columns,
              tasks, subtasks, and attachments. This cannot be undone.
            </p>
            <label class="zc-label" style="margin-bottom:6px;">
              Type <code class="psm-danger-code">{{ project.name }}</code> to confirm:
            </label>
            <input v-model="deleteConfirmName" class="zc-input" placeholder="Project name…" />
            <button
              class="zc-btn danger"
              style="margin-top:14px;width:100%;"
              :disabled="deleteConfirmName !== project.name"
              @click="doDeleteProject"
            >
              <ZIcon name="trash" :size="13" />
              Delete project permanently
            </button>
          </div>
        </template>

      </div>

      <div class="zc-modal-ft">
        <template v-if="activeTab === 'general'">
          <button class="zc-btn ghost" @click="$emit('close')">Cancel</button>
          <button class="zc-btn primary" :disabled="saving" @click="saveGeneral">
            <ZIcon name="check" :size="13" />
            {{ saving ? 'Saving…' : 'Save changes' }}
          </button>
        </template>
        <template v-else>
          <button class="zc-btn ghost" @click="$emit('close')">Close</button>
        </template>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import ZIcon from 'src/components/common/ZIcon.vue'
import { useProject }  from 'src/domains/project/useProject'
import { useBoard }    from 'src/domains/board/useBoard'
import { useCategory } from 'src/domains/category/useCategory'
import { useApp }      from 'src/domains/app/useApp'
import { PROJECT_COLORS } from 'src/domains/project/project.entity'
import { readFile } from '@tauri-apps/plugin-fs'

const props = defineProps({
  project: { type: Object, required: true },
  columns: { type: Array, default: () => [] },
})

const emit = defineEmits(['close', 'updated', 'deleted', 'columnsChanged'])

const { updateProject, deleteProject, getLogoSrc } = useProject()
const { columns: boardCols, updateColumnName, setDoneColumn, reorderColumns, deleteColumn } = useBoard()
const { categories: allCategories, fetchCategories, findOrCreateCategory } = useCategory()
const { selectFile } = useApp()

const PROJ_COLORS = PROJECT_COLORS

const TABS = [
  { id: 'general', label: 'General'     },
  { id: 'columns', label: 'Columns'     },
  { id: 'danger',  label: 'Danger Zone', danger: true },
]

const activeTab = ref('general')
const saving    = ref(false)

const formName     = ref(props.project.name)
const formColor    = ref(props.project.color)
const formCategory = ref(props.project.category_name || '')
const logoPreview  = ref(props.project.logo_path || null)
const newLogoPath  = ref(null)

const formInitials = computed(() => (formName.value || 'P').slice(0, 2).toUpperCase())

onMounted(async () => {
  await fetchCategories()
  boardCols.value = props.columns.map((c) => ({ ...c, tasks: c.tasks || [] }))
})

async function changeLogo() {
  const filePath = await selectFile()
  if (!filePath) return
  newLogoPath.value = filePath
  const bytes = await readFile(filePath)
  const blob = new Blob([bytes])
  if (logoPreview.value?.startsWith('blob:')) URL.revokeObjectURL(logoPreview.value)
  logoPreview.value = URL.createObjectURL(blob)
}

function removeLogo() {
  logoPreview.value = null
  newLogoPath.value = null
}

async function saveGeneral() {
  if (!formName.value.trim()) return
  saving.value = true
  try {
    const changes = { name: formName.value.trim(), color: formColor.value }

    const catName = formCategory.value.trim()
    if (catName) {
      const cat = await findOrCreateCategory(catName)
      changes.category_id = cat.id
    } else {
      changes.category_id = null
    }

    if (!logoPreview.value && props.project.logo_path) {
      changes.logo_path = null
    }

    await updateProject(props.project.id, changes, newLogoPath.value || null)
    newLogoPath.value = null
    emit('updated')
    emit('close')
  } finally {
    saving.value = false
  }
}

const localCols    = boardCols
const editingColId = ref(null)
const colInputs    = {}

function moveColUp(idx) {
  if (idx === 0) return
  const arr = [...localCols.value]
  ;[arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]]
  localCols.value = arr
  persistColOrder()
}

function moveColDown(idx) {
  if (idx >= localCols.value.length - 1) return
  const arr = [...localCols.value]
  ;[arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]]
  localCols.value = arr
  persistColOrder()
}

function persistColOrder() {
  reorderColumns(props.project.id)
  emit('columnsChanged')
}

function startEditColName(col) {
  editingColId.value = col.id
  nextTick(() => colInputs[col.id]?.focus())
}

async function saveColName(col, name) {
  editingColId.value = null
  await updateColumnName(col, name)
  emit('columnsChanged')
}

async function doSetDoneCol(col) {
  await setDoneColumn(col)
  emit('columnsChanged')
}

async function doDeleteCol(col) {
  if (col.tasks?.length > 0) return
  if (!window.confirm(`Delete column "${col.name}"?`)) return
  await deleteColumn(col)
  emit('columnsChanged')
}

const deleteConfirmName = ref('')

async function doDeleteProject() {
  if (deleteConfirmName.value !== props.project.name) return
  await deleteProject(props.project.id)
  emit('deleted')
}
</script>

<style scoped>
.psm { max-width: 520px; width: 100%; }

.psm-tabs {
  display: flex;
  border-bottom: 1px solid var(--zc-border);
  padding: 0 22px;
  gap: 2px;
}

.psm-tab {
  padding: 8px 14px;
  background: transparent;
  border: 0;
  border-bottom: 2px solid transparent;
  color: var(--zc-text-dim);
  font: inherit;
  font-size: 12.5px;
  cursor: pointer;
  transition: color 120ms, border-color 120ms;
  margin-bottom: -1px;
}
.psm-tab:hover         { color: var(--zc-text); }
.psm-tab.active        { color: var(--zc-accent); border-bottom-color: var(--zc-accent); }
.psm-tab.danger.active { color: var(--zc-danger); border-bottom-color: var(--zc-danger); }
.psm-tab.danger:hover  { color: var(--zc-danger); }

.psm-body { padding: 22px !important; min-height: 200px; }
.psm-field { margin-bottom: 18px; }

.psm-colors { display: flex; gap: 8px; flex-wrap: wrap; }
.psm-color {
  width: 24px; height: 24px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform 100ms, border-color 100ms;
}
.psm-color:hover  { transform: scale(1.12); }
.psm-color.active { border-color: var(--zc-text); transform: scale(1.12); }

.psm-logo-row { display: flex; align-items: center; gap: 10px; }
.psm-logo-thumb {
  width: 40px; height: 40px;
  border-radius: 7px;
  display: flex; align-items: center; justify-content: center;
  font-family: var(--zc-mono); font-size: 13px; font-weight: 700;
  color: rgba(0,0,0,.7);
  overflow: hidden; flex-shrink: 0;
}

.psm-empty { font-size: 12.5px; color: var(--zc-text-faint); padding: 12px 0; }
.psm-col-list { display: flex; flex-direction: column; gap: 4px; }

.psm-col-row {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 10px;
  background: var(--zc-surface);
  border: 1px solid var(--zc-border);
  border-radius: var(--zc-r);
  transition: border-color 120ms;
}
.psm-col-row:hover { border-color: var(--zc-border-strong); }

.psm-col-arrows { display: flex; flex-direction: column; gap: 1px; }

.psm-col-name {
  flex: 1; font-size: 12.5px; color: var(--zc-text);
  cursor: default; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.psm-col-name-input { flex: 1; height: 28px; font-size: 12.5px; }

.psm-done-lbl {
  display: flex; align-items: center; gap: 5px;
  font-family: var(--zc-mono); font-size: 10px;
  color: var(--zc-text-faint); cursor: pointer; white-space: nowrap;
}

.psm-task-ct { font-family: var(--zc-mono); font-size: 10.5px; color: var(--zc-text-faint); white-space: nowrap; }

.psm-danger-box {
  background: color-mix(in srgb, var(--zc-danger) 6%, transparent);
  border: 1px solid color-mix(in srgb, var(--zc-danger) 20%, transparent);
  border-radius: var(--zc-r-lg);
  padding: 18px 20px;
}

.psm-danger-title {
  display: flex; align-items: center; gap: 7px;
  font-size: 14px; font-weight: 600; color: var(--zc-danger); margin-bottom: 10px;
}

.psm-danger-desc { font-size: 12.5px; color: var(--zc-text-dim); line-height: 1.6; margin: 0 0 14px; }

.psm-danger-code {
  font-family: var(--zc-mono); font-size: 11px; color: var(--zc-text);
  background: var(--zc-surface-2); padding: 1px 6px; border-radius: 3px;
}
</style>
