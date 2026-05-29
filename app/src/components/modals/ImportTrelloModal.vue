<template>
  <div class="zc-modal-overlay zc-fade" @click="$emit('close')">
    <div class="zc-modal import-modal" @click.stop>

      <div class="zc-modal-hd">
        <div style="display:flex;align-items:center;gap:9px;">
          <ZIcon name="download" :size="15" style="color:var(--zc-accent);" />
          <div class="zc-modal-title">Import from Trello</div>
        </div>
        <button class="zc-modal-x" @click="$emit('close')">
          <ZIcon name="x" :size="14" />
        </button>
      </div>

      <div class="import-steps">
        <span :class="['import-step', step >= 1 ? 'active' : '', step > 1 ? 'done' : '']">
          <span class="import-step-dot">{{ step > 1 ? '✓' : '1' }}</span> Select file
        </span>
        <span class="import-step-line" />
        <span :class="['import-step', step >= 2 ? 'active' : '', step > 2 ? 'done' : '']">
          <span class="import-step-dot">{{ step > 2 ? '✓' : '2' }}</span> Configure
        </span>
        <span class="import-step-line" />
        <span :class="['import-step', step >= 3 ? 'active' : '']">
          <span class="import-step-dot">3</span> Done
        </span>
      </div>

      <div v-if="step === 1" class="zc-modal-body import-body">
        <p class="import-intro">
          Select the <strong>.json</strong> file exported from your Trello board.<br>
          In Trello: <span class="import-mono">Board → Show menu → More → Print and export → Export as JSON</span>
        </p>
        <div :class="['import-dropzone', filePath ? 'selected' : '']" @click="doSelectFile">
          <ZIcon :name="filePath ? 'checklist' : 'folder'" :size="26" :stroke="1.3"
                 :style="{ color: filePath ? 'var(--zc-success)' : 'var(--zc-text-faint)' }" />
          <div v-if="filePath" class="import-file-name">{{ fileBasename }}</div>
          <div v-else class="import-dz-label">Click to choose .json file</div>
        </div>
        <div v-if="parseError" class="import-error">
          <ZIcon name="x" :size="12" /> {{ parseError }}
        </div>
      </div>

      <div v-else-if="step === 2" class="zc-modal-body import-body">
        <div class="import-preview-box">
          <div class="import-preview-title">
            <ZIcon name="grid" :size="13" style="color:var(--zc-accent);" />
            {{ preview.boardName }}
          </div>
          <div class="import-preview-stats">
            <span class="import-stat"><strong>{{ preview.lists.length }}</strong> columns</span>
            <span class="import-stat-sep">·</span>
            <span class="import-stat"><strong>{{ preview.totalCards }}</strong> tasks</span>
          </div>
          <div class="import-col-list">
            <div v-for="list in preview.lists" :key="list.id" class="import-col-row">
              <span class="import-col-dot" :style="{ background: list.isDone ? 'var(--zc-teal)' : 'var(--zc-accent)' }" />
              <span class="import-col-name">{{ list.name }}</span>
              <span v-if="list.isDone" class="import-badge done">done</span>
              <span class="import-col-count">{{ list.cardCount }} tasks</span>
            </div>
          </div>
          <div v-if="preview.skippedLists.length" class="import-warn">
            <ZIcon name="x" :size="11" />
            {{ preview.skippedLists.length }} archived list{{ preview.skippedLists.length > 1 ? 's' : '' }} skipped:
            <span v-for="(n, i) in preview.skippedLists" :key="i" class="import-mono">
              {{ n }}<span v-if="i < preview.skippedLists.length - 1">, </span>
            </span>
          </div>
        </div>

        <div class="import-section-h">Destination</div>
        <div class="import-dest-tabs">
          <button :class="['import-dest-tab', destMode === 'new' ? 'active' : '']" @click="destMode = 'new'">
            <ZIcon name="plus" :size="12" /> New project
          </button>
          <button :class="['import-dest-tab', destMode === 'existing' ? 'active' : '']" @click="destMode = 'existing'">
            <ZIcon name="folder" :size="12" /> Existing project
          </button>
        </div>

        <div v-if="destMode === 'new'" class="import-dest-form">
          <label class="zc-label">Project name</label>
          <input ref="nameInputRef" class="zc-input" v-model="newName" placeholder="Project name…" />
          <label class="zc-label" style="margin-top:12px;">Color</label>
          <div class="zc-color-swatches">
            <button
              v-for="c in PROJECT_COLORS"
              :key="c"
              type="button"
              :class="['zc-color-sw', newColor === c ? 'active' : '']"
              :style="{ background: c }"
              @click="newColor = c"
            />
          </div>
        </div>

        <div v-else class="import-dest-form">
          <label class="zc-label">Project</label>
          <div v-if="projects.length === 0" class="import-no-projects">
            No projects yet — switch to "New project".
          </div>
          <div v-else class="import-project-list">
            <div
              v-for="p in projects"
              :key="p.id"
              :class="['import-project-row', selectedProjectId === p.id ? 'active' : '']"
              @click="selectedProjectId = p.id"
            >
              <span class="import-project-dot" :style="{ background: p.color }" />
              <span class="import-project-name">{{ p.name }}</span>
              <span v-if="p.category_name" class="import-project-cat">{{ p.category_name }}</span>
              <ZIcon v-if="selectedProjectId === p.id" name="check" :size="13"
                     style="color:var(--zc-accent);margin-left:auto;flex-shrink:0;" />
            </div>
          </div>
          <p v-if="destMode === 'existing' && selectedProjectId" class="import-existing-note">
            Columns will be appended after the project's existing columns.
          </p>
        </div>

        <div v-if="importError" class="import-error" style="margin-top:12px;">
          <ZIcon name="x" :size="12" /> {{ importError }}
        </div>
      </div>

      <div v-else-if="step === 3" class="zc-modal-body import-body import-result">
        <div v-if="importing" class="import-loading">
          <div class="import-spinner" />
          <span>Importing…</span>
        </div>
        <div v-else-if="result" class="import-success">
          <div class="import-success-icon"><ZIcon name="check" :size="28" :stroke="2" /></div>
          <div class="import-success-title">Import complete!</div>
          <div class="import-success-stats">
            <span><strong>{{ result.tasksImported }}</strong> tasks</span>
            <span class="import-stat-sep">·</span>
            <span><strong>{{ result.columnsCreated }}</strong> columns</span>
          </div>
        </div>
      </div>

      <div class="zc-modal-ft">
        <template v-if="step === 1">
          <button class="zc-btn ghost" @click="$emit('close')">Cancel</button>
          <button class="zc-btn primary" :disabled="!filePath || parsing" @click="goToStep2">
            <span v-if="parsing">Reading…</span>
            <template v-else>Next <ZIcon name="arrowRight" :size="13" /></template>
          </button>
        </template>
        <template v-else-if="step === 2">
          <button class="zc-btn ghost" @click="step = 1">Back</button>
          <button class="zc-btn primary" :disabled="!canImport || importing" @click="doRunImport">
            Import <ZIcon name="arrowRight" :size="13" />
          </button>
        </template>
        <template v-else-if="step === 3">
          <button v-if="!importing" class="zc-btn ghost" @click="$emit('close')">Close</button>
          <button v-if="result && !importing" class="zc-btn primary" @click="goToProject">
            Open project <ZIcon name="arrowRight" :size="13" />
          </button>
        </template>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import ZIcon from 'src/components/common/ZIcon.vue'
import { useImport }  from 'src/domains/import/useImport'
import { useProject } from 'src/domains/project/useProject'
import { PROJECT_COLORS } from 'src/domains/project/project.entity'

const emit   = defineEmits(['close', 'imported'])
const router = useRouter()

const {
  filePath, fileBasename, parsing, parseError,
  preview, importing, importError, result,
  selectFile, parseFile, runImport,
} = useImport()

const { projects, fetchProjects } = useProject()

const step            = ref(1)
const destMode        = ref('new')
const newName         = ref('')
const newColor        = ref(PROJECT_COLORS[0])
const selectedProjectId = ref(null)
const nameInputRef    = ref(null)

const canImport = computed(() => {
  if (destMode.value === 'new') return newName.value.trim().length > 0
  return selectedProjectId.value !== null
})

async function doSelectFile() {
  await selectFile()
}

async function goToStep2() {
  if (!filePath.value) return
  const parsed = await parseFile()
  if (!parsed) return

  newName.value = parsed.boardName
  await fetchProjects()

  step.value = 2
  await nextTick()
  nameInputRef.value?.focus()
}

async function doRunImport() {
  if (!canImport.value) return
  step.value = 3

  const params = { filePath: filePath.value, mode: destMode.value }
  if (destMode.value === 'new') {
    params.newProjectName  = newName.value.trim()
    params.newProjectColor = newColor.value
  } else {
    params.existingProjectId = selectedProjectId.value
  }

  try {
    await runImport(params)
  } catch (_) {
    step.value = 2
  }
}

function goToProject() {
  if (!result.value?.projectId) return
  emit('imported', result.value.projectId)
  emit('close')
  router.push(`/project/${result.value.projectId}`)
}
</script>

<style scoped>
.import-modal { width: 520px; max-width: 95vw; }

.import-steps {
  display: flex; align-items: center; gap: 0;
  padding: 10px 22px 12px;
  border-bottom: 1px solid var(--zc-border);
}
.import-step {
  display: flex; align-items: center; gap: 6px;
  font-size: 11.5px; color: var(--zc-text-faint);
  font-family: var(--zc-mono); letter-spacing: .03em; transition: color .15s;
}
.import-step.active { color: var(--zc-text); }
.import-step.done   { color: var(--zc-success); }
.import-step-dot {
  width: 20px; height: 20px; border-radius: 50%;
  background: var(--zc-surface-2); border: 1px solid var(--zc-border-strong);
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 700; flex-shrink: 0;
  transition: background .15s, border-color .15s;
}
.import-step.active .import-step-dot { background: var(--zc-accent); border-color: var(--zc-accent); color: #fff; }
.import-step.done   .import-step-dot { background: var(--zc-success); border-color: var(--zc-success); color: #fff; font-size: 11px; }
.import-step-line   { flex: 1; height: 1px; background: var(--zc-border); margin: 0 8px; max-width: 36px; }

.import-body {
  padding: 18px 22px; display: flex; flex-direction: column; gap: 14px;
  max-height: 420px; overflow-y: auto;
}

.import-intro { font-size: 12.5px; color: var(--zc-text-dim); line-height: 1.6; margin: 0; }
.import-mono  {
  font-family: var(--zc-mono); font-size: 10.5px; color: var(--zc-text-faint);
  background: var(--zc-surface-2); padding: 1px 5px; border-radius: 3px;
}
.import-dropzone {
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px;
  padding: 28px 20px; border: 1.5px dashed var(--zc-border-strong); border-radius: var(--zc-r-lg);
  cursor: pointer; transition: border-color .15s, background .15s; min-height: 110px;
}
.import-dropzone:hover    { border-color: var(--zc-accent); background: rgba(124,106,247,.04); }
.import-dropzone.selected { border-color: var(--zc-success); background: rgba(76,175,130,.05); }
.import-dz-label  { font-size: 12.5px; color: var(--zc-text-faint); }
.import-file-name { font-family: var(--zc-mono); font-size: 11.5px; color: var(--zc-success); word-break: break-all; text-align: center; }

.import-preview-box {
  background: var(--zc-surface); border: 1px solid var(--zc-border);
  border-radius: var(--zc-r-lg); padding: 13px 15px;
  display: flex; flex-direction: column; gap: 8px;
}
.import-preview-title { display: flex; align-items: center; gap: 7px; font-size: 13.5px; font-weight: 600; color: var(--zc-text); }
.import-preview-stats { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--zc-text-dim); }
.import-stat-sep { color: var(--zc-text-faint); }

.import-col-list { display: flex; flex-direction: column; gap: 4px; margin-top: 2px; }
.import-col-row  { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--zc-text-dim); }
.import-col-dot  { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.import-col-name { flex: 1; }
.import-col-count { font-family: var(--zc-mono); font-size: 10.5px; color: var(--zc-text-faint); }
.import-badge    { font-family: var(--zc-mono); font-size: 9.5px; padding: 1px 6px; border-radius: 10px; letter-spacing: .03em; text-transform: uppercase; }
.import-badge.done { background: rgba(62,207,207,.12); color: var(--zc-teal); }

.import-warn {
  display: flex; align-items: center; gap: 5px; flex-wrap: wrap;
  font-size: 11.5px; color: var(--zc-warning);
  padding: 7px 10px; background: rgba(224,160,80,.08); border-radius: var(--zc-r-sm); margin-top: 2px;
}

.import-section-h { font-size: 11px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: var(--zc-text-faint); font-family: var(--zc-mono); }
.import-dest-tabs { display: flex; gap: 6px; }
.import-dest-tab  {
  display: flex; align-items: center; gap: 6px; padding: 6px 14px;
  border-radius: var(--zc-r); border: 1px solid var(--zc-border);
  background: transparent; color: var(--zc-text-dim); font: inherit; font-size: 12.5px; cursor: pointer;
  transition: border-color .12s, color .12s, background .12s;
}
.import-dest-tab:hover  { border-color: var(--zc-border-strong); color: var(--zc-text); }
.import-dest-tab.active { border-color: var(--zc-accent); color: var(--zc-accent); background: rgba(124,106,247,.07); }
.import-dest-form { display: flex; flex-direction: column; gap: 6px; }

.import-project-list {
  display: flex; flex-direction: column; gap: 3px;
  max-height: 160px; overflow-y: auto;
  border: 1px solid var(--zc-border); border-radius: var(--zc-r); padding: 4px;
}
.import-project-row { display: flex; align-items: center; gap: 9px; padding: 7px 10px; border-radius: var(--zc-r-sm); cursor: pointer; transition: background .1s; }
.import-project-row:hover  { background: var(--zc-hover); }
.import-project-row.active { background: rgba(124,106,247,.1); }
.import-project-dot  { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.import-project-name { font-size: 13px; color: var(--zc-text); flex: 1; }
.import-project-cat  { font-size: 10.5px; font-family: var(--zc-mono); color: var(--zc-text-faint); background: var(--zc-surface-2); padding: 1px 6px; border-radius: 10px; }
.import-no-projects  { font-size: 12.5px; color: var(--zc-text-faint); padding: 10px; text-align: center; border: 1px dashed var(--zc-border); border-radius: var(--zc-r); }
.import-existing-note { font-size: 11.5px; color: var(--zc-text-faint); margin: 0; }

.import-result { align-items: center; justify-content: center; min-height: 180px; }
.import-loading { display: flex; flex-direction: column; align-items: center; gap: 14px; color: var(--zc-text-dim); font-size: 13px; }
.import-spinner {
  width: 32px; height: 32px; border-radius: 50%;
  border: 3px solid var(--zc-border-strong); border-top-color: var(--zc-accent);
  animation: spin .7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.import-success { display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center; }
.import-success-icon { width: 52px; height: 52px; border-radius: 50%; background: rgba(76,175,130,.15); display: flex; align-items: center; justify-content: center; color: var(--zc-success); }
.import-success-title { font-size: 15px; font-weight: 600; color: var(--zc-text); }
.import-success-stats { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--zc-text-dim); }

.import-error {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; color: var(--zc-danger);
  background: rgba(224,92,92,.08); padding: 8px 12px; border-radius: var(--zc-r-sm);
}
</style>
