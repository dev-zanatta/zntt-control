<template>
  <q-page class="settings-page">

    <header class="zc-page-hd">
      <h1 class="zc-page-title">Settings</h1>
    </header>

    <div class="settings-layout">

      <!-- ── Left nav ──────────────────────────────── -->
      <nav class="settings-nav">
        <button
          v-for="s in SECTIONS"
          :key="s.id"
          :class="['settings-nav-item', active === s.id ? 'active' : '']"
          @click="active = s.id"
        >
          <ZIcon :name="s.icon" :size="14" />
          {{ s.label }}
        </button>
      </nav>

      <!-- ── Content ───────────────────────────────── -->
      <div class="settings-content">

        <!-- ══ Appearance ══════════════════════════════ -->
        <template v-if="active === 'appearance'">

          <div class="settings-group">
            <div class="settings-group-title">Theme</div>
            <div class="zc-toggle-group">
              <button
                :class="uiStore.theme === 'dark' ? 'active' : ''"
                @click="uiStore.setTheme('dark')"
              >
                <ZIcon name="moon" :size="13" /> Dark
              </button>
              <button
                :class="uiStore.theme === 'light' ? 'active' : ''"
                @click="uiStore.setTheme('light')"
              >
                <ZIcon name="sun" :size="13" /> Light
              </button>
              <button
                :class="uiStore.theme === 'pixel' ? 'active' : ''"
                @click="uiStore.setTheme('pixel')"
                title="8-bit retro theme (Pixelify Sans)"
              >
                <ZIcon name="pixel" :size="13" /> 8-bit
              </button>
            </div>
            <p v-if="uiStore.theme === 'pixel'" class="settings-desc" style="margin-top:8px;">
              Uses <strong>Pixelify Sans</strong> — a Minecraft-style pixel font. Chunky borders, hard shadows, retro vibes.
            </p>
          </div>

          <div class="settings-group">
            <div class="settings-group-title">Accent color</div>
            <div class="accent-swatches">
              <button
                v-for="color in ACCENT_PRESETS"
                :key="color"
                :class="['accent-swatch', uiStore.accent === color ? 'active' : '']"
                :style="{ background: color }"
                :title="color"
                @click="uiStore.setAccent(color)"
              />
              <!-- Custom color picker -->
              <label class="accent-swatch custom" title="Custom color">
                <input
                  type="color"
                  class="accent-color-input"
                  :value="uiStore.accent"
                  @input="uiStore.setAccent($event.target.value)"
                />
                <ZIcon name="pencil" :size="11" />
              </label>
            </div>
            <div class="accent-preview">
              Current:
              <span
                class="accent-preview-dot"
                :style="{ background: uiStore.accent }"
              />
              <code class="accent-preview-hex">{{ uiStore.accent }}</code>
            </div>
          </div>

        </template>

        <!-- ══ Categories ══════════════════════════════ -->
        <template v-if="active === 'categories'">

          <div class="settings-group">
            <div class="settings-group-title">
              Categories
              <span class="settings-count">{{ categories.length }}</span>
            </div>

            <div v-if="categories.length === 0 && !loadingCats" class="settings-empty">
              No categories yet. Create them when adding projects.
            </div>

            <div v-else class="cat-list">
              <div
                v-for="cat in categories"
                :key="cat.id"
                class="cat-row"
              >
                <template v-if="editingCatId === cat.id">
                  <input
                    :ref="el => { if (el) catInputs[cat.id] = el }"
                    class="zc-input"
                    style="flex:1;height:28px;font-size:12.5px;"
                    :value="cat.name"
                    @blur="saveCat(cat, $event.target.value)"
                    @keydown.enter="saveCat(cat, $event.target.value)"
                    @keydown.esc="editingCatId = null"
                  />
                </template>
                <template v-else>
                  <span class="cat-name">{{ cat.name }}</span>
                  <span class="cat-count">
                    {{ cat.project_count }}
                    {{ cat.project_count === 1 ? 'project' : 'projects' }}
                  </span>
                  <button
                    class="zc-btn ghost sm icon"
                    title="Rename"
                    @click="startEditCat(cat)"
                  >
                    <ZIcon name="pencil" :size="12" />
                  </button>
                  <button
                    class="zc-btn ghost sm icon"
                    :title="cat.project_count > 0
                      ? `Delete — will unassign ${cat.project_count} project(s)`
                      : 'Delete'"
                    @click="deleteCat(cat)"
                  >
                    <ZIcon name="trash" :size="12" />
                  </button>
                </template>
              </div>
            </div>

            <template v-if="addingCat">
              <div style="display:flex;gap:6px;margin-top:12px;">
                <input
                  ref="newCatInput"
                  class="zc-input"
                  placeholder="Category name…"
                  v-model="newCatName"
                  @keydown.enter="createCat"
                  @keydown.esc="addingCat = false"
                />
                <button class="zc-btn primary sm" @click="createCat">Add</button>
                <button class="zc-btn ghost sm" @click="addingCat = false">Cancel</button>
              </div>
            </template>
            <button v-else class="zc-btn ghost sm" style="margin-top:12px;" @click="startAddCat">
              <ZIcon name="plus" :size="12" /> Add category
            </button>

            <!-- Error when trying to delete in-use category -->
            <transition name="fade-msg">
              <div v-if="catError" class="export-msg error" style="margin-top:10px;">
                {{ catError }}
              </div>
            </transition>
          </div>

        </template>

        <!-- ══ Data & Backup ═══════════════════════════ -->
        <template v-if="active === 'data'">

          <div class="settings-group">
            <div class="settings-group-title">Data location</div>
            <div class="data-path-row">
              <code class="data-path">{{ dataPath || '…' }}</code>
              <button class="zc-btn ghost sm" @click="openDataFolder">
                <ZIcon name="folder" :size="13" /> Open folder
              </button>
            </div>
          </div>

          <div class="settings-group">
            <div class="settings-group-title">Export</div>
            <p class="settings-desc">
              Export all projects, tasks, subtasks, and settings as a single JSON file.
              Useful as a backup or for migrating to another machine.
            </p>
            <button
              class="zc-btn secondary sm"
              :disabled="exporting"
              @click="exportData"
            >
              <ZIcon name="download" :size="13" />
              {{ exporting ? 'Exporting…' : 'Export to JSON' }}
            </button>
            <transition name="fade-msg">
              <div
                v-if="exportMsg"
                :class="['export-msg', exportMsg.type]"
              >
                {{ exportMsg.text }}
              </div>
            </transition>
          </div>

        </template>

        <!-- ══ About ════════════════════════════════════ -->
        <template v-if="active === 'about'">

          <div class="settings-group">
            <div class="about-logo">
              <!-- Z mark -->
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" style="flex-shrink:0;">
                <defs>
                  <linearGradient id="aboutZ" x1="4" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
                    <stop stop-color="#4dabf7"/>
                    <stop offset="1" stop-color="#7c6af7"/>
                  </linearGradient>
                </defs>
                <polyline points="4,5 20,5 4,19 20,19" stroke="url(#aboutZ)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <div>
                <div class="about-logo-name">zntt-control</div>
                <div class="about-logo-ver">v{{ appVersion || '…' }}</div>
              </div>
            </div>
            <p class="settings-desc" style="margin-top:10px;">
              Personal project &amp; task manager. Fully offline — no accounts, no cloud sync.
            </p>
          </div>

          <div class="settings-group">
            <div class="settings-group-title">Build info</div>
            <div class="about-row">
              <span class="about-label">Version</span>
              <code class="about-val">{{ appVersion || '—' }}</code>
            </div>
            <div class="about-row">
              <span class="about-label">Database</span>
              <code class="about-val">{{ dataPath ? dataPath + '/zntt.db' : '—' }}</code>
            </div>
            <div class="about-row">
              <span class="about-label">Stack</span>
              <code class="about-val">Electron · Vue 3 · SQLite</code>
            </div>
          </div>

        </template>

      </div>
    </div>

  </q-page>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue'
import { useUiStore, ACCENT_PRESETS } from 'src/stores/uiStore'
import { useIpc } from 'src/composables/useIpc'
import ZIcon from 'src/components/common/ZIcon.vue'

const uiStore = useUiStore()
const api = useIpc()

// ── nav sections ───────────────────────────────────────────────────────────
const SECTIONS = [
  { id: 'appearance', label: 'Appearance', icon: 'sun'      },
  { id: 'categories', label: 'Categories', icon: 'grid'     },
  { id: 'data',       label: 'Data',       icon: 'download' },
  { id: 'about',      label: 'About',      icon: 'bell'     },
]

const active = ref('appearance')

// ── categories ─────────────────────────────────────────────────────────────
const categories   = ref([])
const loadingCats  = ref(false)
const editingCatId = ref(null)
const catInputs    = {}
const addingCat    = ref(false)
const newCatName   = ref('')
const newCatInput  = ref(null)
const catError     = ref(null)

async function loadCategories() {
  loadingCats.value = true
  try {
    categories.value = await api.getCategories()
  } finally {
    loadingCats.value = false
  }
}

function startEditCat(cat) {
  editingCatId.value = cat.id
  nextTick(() => catInputs[cat.id]?.focus())
}

async function saveCat(cat, name) {
  editingCatId.value = null
  const trimmed = name.trim()
  if (!trimmed || trimmed === cat.name) return
  await api.updateCategory(cat.id, trimmed)
  cat.name = trimmed
}

function startAddCat() {
  addingCat.value = true
  newCatName.value = ''
  nextTick(() => newCatInput.value?.focus())
}

async function createCat() {
  if (!newCatName.value.trim()) return
  const cat = await api.createCategory(newCatName.value.trim())
  categories.value.push({ ...cat, project_count: 0 })
  newCatName.value = ''
  addingCat.value  = false
}

async function deleteCat(cat) {
  // Block deletion if category is in use (per spec)
  if (cat.project_count > 0) {
    catError.value = `"${cat.name}" is assigned to ${cat.project_count} project(s). Reassign or delete those projects first.`
    setTimeout(() => { catError.value = null }, 5000)
    return
  }
  if (!window.confirm(`Delete category "${cat.name}"?`)) return
  await api.deleteCategory(cat.id)
  categories.value = categories.value.filter(c => c.id !== cat.id)
}

// ── data / export ──────────────────────────────────────────────────────────
const dataPath   = ref('')
const appVersion = ref('')
const exporting  = ref(false)
const exportMsg  = ref(null)

async function openDataFolder() {
  await api.openDataFolder()
}

async function exportData() {
  exporting.value = true
  exportMsg.value = null
  try {
    const filePath = await api.selectExportPath()
    if (!filePath) return
    await api.exportData(filePath)
    exportMsg.value = { type: 'success', text: '✓ Export saved successfully.' }
  } catch (e) {
    exportMsg.value = { type: 'error', text: 'Export failed: ' + (e?.message || e) }
  } finally {
    exporting.value = false
    if (exportMsg.value) {
      setTimeout(() => { exportMsg.value = null }, 5000)
    }
  }
}

// ── init ───────────────────────────────────────────────────────────────────
onMounted(async () => {
  await loadCategories()
  try {
    const [ver, dp] = await Promise.all([
      api.getAppVersion(),
      api.getDataPath(),
    ])
    appVersion.value = ver
    dataPath.value   = dp
  } catch (_) {
    // handlers may not be registered in dev mode stub
  }
})
</script>

<style scoped>
/* ── page shell ──────────────────────────────────────── */
.settings-page {
  display: flex;
  flex-direction: column;
  background: var(--zc-bg);
  min-height: 100vh;
}

/* ── layout ──────────────────────────────────────────── */
.settings-layout {
  display: flex;
  flex: 1;
  gap: 0;
  padding: 0 0 40px;
  overflow: hidden;
}

/* ── left nav ────────────────────────────────────────── */
.settings-nav {
  width: 180px;
  flex-shrink: 0;
  padding: 4px 12px;
  border-right: 1px solid var(--zc-border);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.settings-nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  background: transparent;
  border: 0;
  border-radius: var(--zc-r);
  color: var(--zc-text-dim);
  font: inherit;
  font-size: 12.5px;
  text-align: left;
  cursor: pointer;
  transition: background 120ms, color 120ms;
}
.settings-nav-item:hover { background: var(--zc-hover); color: var(--zc-text); }
.settings-nav-item.active {
  background: var(--zc-accent-soft);
  color: var(--zc-accent);
  font-weight: 600;
}

/* ── right content ───────────────────────────────────── */
.settings-content {
  flex: 1;
  padding: 8px 36px 0;
  overflow-y: auto;
  max-width: 560px;
}

/* ── group ───────────────────────────────────────────── */
.settings-group {
  margin-bottom: 32px;
}

.settings-group-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--zc-mono);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .08em;
  color: var(--zc-text-faint);
  margin-bottom: 14px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--zc-border);
}

.settings-count {
  font-family: var(--zc-mono);
  font-size: 10px;
  color: var(--zc-text-faint);
}

.settings-desc {
  font-size: 12.5px;
  color: var(--zc-text-dim);
  line-height: 1.6;
  margin: 0 0 14px;
}

.settings-empty {
  font-size: 12.5px;
  color: var(--zc-text-faint);
  padding: 12px 0;
}

/* ── accent swatches ─────────────────────────────────── */
.accent-swatches {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.accent-swatch {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform 100ms, border-color 100ms;
  flex-shrink: 0;
}
.accent-swatch:hover { transform: scale(1.15); }
.accent-swatch.active {
  border-color: var(--zc-text);
  transform: scale(1.15);
}

.accent-swatch.custom {
  background: var(--zc-surface-2);
  border: 1px solid var(--zc-border-strong);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--zc-text-dim);
  position: relative;
  overflow: hidden;
  cursor: pointer;
}
.accent-color-input {
  position: absolute;
  inset: 0;
  opacity: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
  border: none;
  padding: 0;
}

.accent-preview {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  font-family: var(--zc-mono);
  font-size: 11px;
  color: var(--zc-text-faint);
}
.accent-preview-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
.accent-preview-hex {
  font-family: var(--zc-mono);
  font-size: 11px;
  color: var(--zc-text-dim);
  background: none;
  padding: 0;
}

/* ── categories ──────────────────────────────────────── */
.cat-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.cat-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: var(--zc-r);
  background: var(--zc-surface);
  border: 1px solid var(--zc-border);
  transition: border-color 120ms;
}
.cat-row:hover { border-color: var(--zc-border-strong); }

.cat-name {
  flex: 1;
  font-size: 13px;
  color: var(--zc-text);
}
.cat-count {
  font-family: var(--zc-mono);
  font-size: 10.5px;
  color: var(--zc-text-faint);
  margin-right: 4px;
}

/* ── data ────────────────────────────────────────────── */
.data-path-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.data-path {
  flex: 1;
  font-family: var(--zc-mono);
  font-size: 11px;
  color: var(--zc-text-dim);
  background: var(--zc-surface);
  border: 1px solid var(--zc-border);
  border-radius: var(--zc-r-sm);
  padding: 5px 9px;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.export-msg {
  margin-top: 10px;
  padding: 8px 12px;
  border-radius: var(--zc-r);
  font-size: 12.5px;
}
.export-msg.success {
  background: color-mix(in srgb, var(--zc-success) 12%, transparent);
  color: var(--zc-success);
  border: 1px solid color-mix(in srgb, var(--zc-success) 25%, transparent);
}
.export-msg.error {
  background: color-mix(in srgb, var(--zc-danger) 12%, transparent);
  color: var(--zc-danger);
  border: 1px solid color-mix(in srgb, var(--zc-danger) 25%, transparent);
}

/* ── about ───────────────────────────────────────────── */
.about-logo {
  display: flex;
  align-items: center;
  gap: 12px;
}
.about-logo-name {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -.02em;
  color: var(--zc-text);
}
.about-logo-ver {
  font-family: var(--zc-mono);
  font-size: 11px;
  color: var(--zc-text-faint);
  margin-top: 2px;
}

.about-row {
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding: 7px 0;
  border-bottom: 1px solid var(--zc-border);
  font-size: 12.5px;
}
.about-row:last-child { border-bottom: none; }
.about-label {
  width: 80px;
  flex-shrink: 0;
  color: var(--zc-text-faint);
  font-family: var(--zc-mono);
  font-size: 11px;
}
.about-val {
  flex: 1;
  font-family: var(--zc-mono);
  font-size: 11px;
  color: var(--zc-text-dim);
  background: none;
  padding: 0;
  word-break: break-all;
}

/* ── transition ──────────────────────────────────────── */
.fade-msg-enter-active,
.fade-msg-leave-active { transition: opacity 300ms, transform 200ms; }
.fade-msg-enter-from   { opacity: 0; transform: translateY(-4px); }
.fade-msg-leave-to     { opacity: 0; }
</style>
