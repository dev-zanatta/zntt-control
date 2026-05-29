<template>
  <div class="zc-modal-overlay zc-fade" @click="$emit('close')">
    <div class="zc-modal zc-modal--md" @click.stop>
      <div class="zc-modal-hd">
        <div class="zc-modal-title">New Project</div>
        <button class="zc-modal-x" @click="$emit('close')">
          <ZIcon name="x" :size="14" />
        </button>
      </div>

      <div class="zc-modal-body" style="padding: 20px 22px;">
        <div style="display: grid; gap: 16px;">
          <div>
            <label class="zc-label">Name</label>
            <input
              ref="nameInput"
              class="zc-input"
              placeholder="My new project"
              v-model="name"
              @keydown.enter="submit"
            />
          </div>

          <div>
            <label class="zc-label">Color</label>
            <div class="zc-color-swatches">
              <button
                v-for="c in PROJECT_COLORS"
                :key="c"
                type="button"
                :class="['zc-color-sw', color === c ? 'active' : '']"
                :style="{ background: c }"
                @click="color = c"
              />
              <span class="zc-color-custom" title="Custom hex">+</span>
            </div>
          </div>

          <div>
            <label class="zc-label">Logo (optional)</label>
            <div class="zc-logo-drop" @click="chooseLogo">
              <div
                class="zc-logo-prev"
                :style="{ background: color, color: '#0d0d0d', fontFamily: 'var(--zc-mono)', fontWeight: 700 }"
              >
                <img v-if="logoPreview" :src="logoPreview" style="width:100%;height:100%;object-fit:cover;border-radius:4px;" />
                <span v-else>{{ nameInitials }}</span>
              </div>
              <div style="flex: 1; font-size: 12.5px; color: var(--zc-text-dim);">
                Upload image… <span style="font-family: var(--zc-mono); font-size: 10.5px;">(PNG, SVG, JPG)</span>
              </div>
              <button class="zc-btn ghost sm" type="button">Choose…</button>
            </div>
          </div>

          <div>
            <label class="zc-label">Category</label>
            <input
              class="zc-input"
              placeholder="type or select…  (dev, study, personal)"
              v-model="category"
              list="category-suggestions"
            />
            <datalist id="category-suggestions">
              <option v-for="cat in existingCategories" :key="cat.id" :value="cat.name" />
            </datalist>
          </div>

          <div class="zc-task-section" style="margin: 4px 0 0;">
            <div class="zc-task-section-h">Columns</div>
            <div v-for="col in cols" :key="col.id" class="zc-coldef">
              <span class="zc-coldef-grip"><ZIcon name="grip" :size="13" :stroke="1" /></span>
              <input
                class="zc-input zc-coldef-input"
                :value="col.name"
                @input="setColName(col.id, $event.target.value)"
                placeholder="Column name"
              />
              <label class="zc-coldef-done" @click="setDone(col.id)">
                <span :class="['zc-radio', col.done ? 'active' : '']" />
                done
              </label>
              <button class="zc-btn ghost sm icon zc-coldef-x" type="button" @click="delCol(col.id)">
                <ZIcon name="x" :size="12" />
              </button>
            </div>
            <button class="zc-btn ghost sm" type="button" style="margin-top: 4px;" @click="addCol">
              <ZIcon name="plus" :size="12" /> Add column
            </button>
          </div>
        </div>
      </div>

      <div class="zc-modal-ft">
        <button class="zc-btn ghost" type="button" @click="$emit('close')">Cancel</button>
        <button
          class="zc-btn primary"
          type="button"
          :disabled="!name.trim() || saving"
          @click="submit"
        >
          <span v-if="saving">Creating…</span>
          <template v-else>Create <ZIcon name="arrowRight" :size="13" /></template>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import ZIcon from 'src/components/common/ZIcon.vue'
import { useProject }  from 'src/domains/project/useProject'
import { useBoard }    from 'src/domains/board/useBoard'
import { useCategory } from 'src/domains/category/useCategory'
import { useApp }      from 'src/domains/app/useApp'
import { PROJECT_COLORS } from 'src/domains/project/project.entity'
import { readFile } from '@tauri-apps/plugin-fs'

const props = defineProps({
  existingCategories: { type: Array, default: () => [] },
})

const emit = defineEmits(['close', 'created'])

const { createProject } = useProject()
const { createColumn }  = useBoard()
const { findOrCreateCategory } = useCategory()
const { selectFile } = useApp()

let colIdCounter = 10
const DEFAULT_COLS = [
  { id: 'c1', name: 'Backlog', done: false },
  { id: 'c2', name: 'Doing',   done: false },
  { id: 'c3', name: 'Review',  done: false },
  { id: 'c4', name: 'Done',    done: true  },
]

const nameInput  = ref(null)
const name       = ref('')
const color      = ref(PROJECT_COLORS[0])
const category   = ref('')
const cols       = ref(DEFAULT_COLS.map((c) => ({ ...c })))
const logoPath   = ref(null)
const logoPreview = ref(null)
const saving     = ref(false)

const nameInitials = computed(() => (name.value || 'P').slice(0, 2).toUpperCase())

function setColName(id, val) {
  cols.value = cols.value.map((c) => (c.id === id ? { ...c, name: val } : c))
}
function setDone(id) {
  cols.value = cols.value.map((c) => ({ ...c, done: c.id === id }))
}
function delCol(id) {
  cols.value = cols.value.filter((c) => c.id !== id)
}
function addCol() {
  cols.value.push({ id: 'c' + (++colIdCounter), name: '', done: false })
}

async function chooseLogo() {
  const filePath = await selectFile()
  if (!filePath) return
  logoPath.value = filePath
  const bytes = await readFile(filePath)
  const blob = new Blob([bytes])
  if (logoPreview.value?.startsWith('blob:')) URL.revokeObjectURL(logoPreview.value)
  logoPreview.value = URL.createObjectURL(blob)
}

async function submit() {
  if (!name.value.trim() || saving.value) return
  saving.value = true
  try {
    let categoryId = null
    if (category.value.trim()) {
      const cat = await findOrCreateCategory(category.value.trim(), props.existingCategories)
      categoryId = cat.id
    }

    const project = await createProject({
      name:       name.value.trim(),
      color:      color.value,
      category_id: categoryId,
      logoPath:   logoPath.value,
    })

    const validCols = cols.value.filter((c) => c.name.trim())
    for (let i = 0; i < validCols.length; i++) {
      await createColumn({
        project_id:     project.id,
        name:           validCols[i].name.trim(),
        position:       i,
        is_done_column: validCols[i].done ? 1 : 0,
      })
    }

    emit('created', project)
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  nameInput.value?.focus()
})
</script>
