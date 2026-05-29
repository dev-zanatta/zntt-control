<template>
  <Teleport to="body">
    <transition name="search-fade">
      <div
        v-if="searchOpen"
        class="search-overlay"
        @click.self="closeSearch()"
        @keydown.esc="closeSearch()"
      >
        <div class="search-modal">

          <div class="search-input-row">
            <ZIcon name="search" :size="15" class="search-icon" />
            <input
              ref="inputRef"
              class="search-input"
              v-model="query"
              placeholder="Search tasks across all projects…"
              @input="onInput"
              @keydown.esc.prevent="closeSearch()"
              @keydown.arrow-down.prevent="moveDown"
              @keydown.arrow-up.prevent="moveUp"
              @keydown.enter.prevent="selectCurrent"
            />
            <kbd class="search-kbd">Esc</kbd>
          </div>

          <div class="search-body" v-if="query.trim()">
            <div v-if="loading" class="search-empty">Searching…</div>
            <div v-else-if="results.length === 0" class="search-empty">
              No tasks found for <strong>{{ query }}</strong>
            </div>
            <div v-else class="search-results">
              <button
                v-for="(r, i) in results"
                :key="r.id"
                :class="['search-result', i === activeIdx ? 'active' : '']"
                @mouseenter="activeIdx = i"
                @click="selectResult(r)"
              >
                <span class="search-result-title">{{ r.title }}</span>
                <span class="search-result-meta">
                  <span class="search-result-dot" :style="{ background: r.project_color }" />
                  <span class="search-result-proj">{{ r.project_name }}</span>
                  <span class="search-sep">›</span>
                  <span class="search-result-col">{{ r.column_name }}</span>
                  <span v-if="r.priority" :class="['search-result-pri', 'pri-' + r.priority]">
                    {{ r.priority }}
                  </span>
                </span>
              </button>
            </div>
          </div>

          <div v-else class="search-hint">
            <ZIcon name="search" :size="13" />
            Type to search tasks across all projects
            <kbd class="search-kbd">Ctrl K</kbd>
          </div>

        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useSettings } from 'src/domains/settings/useSettings'
import { useTaskSearch } from 'src/domains/task/useTask'
import ZIcon from './ZIcon.vue'

const router = useRouter()
const { searchOpen, closeSearch } = useSettings()
const { results, loading, search } = useTaskSearch()

const query     = ref('')
const activeIdx = ref(0)
const inputRef  = ref(null)

watch(searchOpen, (open) => {
  if (open) {
    query.value     = ''
    results.value   = []
    activeIdx.value = 0
    nextTick(() => inputRef.value?.focus())
  }
})

function onInput() {
  activeIdx.value = 0
  search(query.value)
}

function moveDown() { if (activeIdx.value < results.value.length - 1) activeIdx.value++ }
function moveUp()   { if (activeIdx.value > 0) activeIdx.value-- }

function selectCurrent() {
  const r = results.value[activeIdx.value]
  if (r) selectResult(r)
}

function selectResult(r) {
  closeSearch()
  router.push({
    name:   'project-board',
    params: { id: r.project_id },
    query:  { task: r.id },
  })
}

function handleGlobalKey(e) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault()
    const { openSearch } = useSettings()
    openSearch()
  }
}

onMounted(()       => document.addEventListener('keydown', handleGlobalKey))
onBeforeUnmount(() => document.removeEventListener('keydown', handleGlobalKey))
</script>

<style scoped>
.search-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  z-index: 9999;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 80px;
  backdrop-filter: blur(2px);
}

.search-modal {
  width: 560px;
  background: var(--zc-surface);
  border: 1px solid var(--zc-border-strong);
  border-radius: var(--zc-r-lg);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.6);
  overflow: hidden;
}

.search-input-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--zc-border);
}

.search-icon { color: var(--zc-text-faint); flex-shrink: 0; }

.search-input {
  flex: 1;
  background: transparent;
  border: 0;
  outline: none;
  font: inherit;
  font-size: 14px;
  color: var(--zc-text);
}
.search-input::placeholder { color: var(--zc-text-faint); }

.search-kbd {
  font-family: var(--zc-mono);
  font-size: 10px;
  color: var(--zc-text-faint);
  background: var(--zc-surface-2);
  border: 1px solid var(--zc-border-strong);
  border-radius: 4px;
  padding: 2px 6px;
  flex-shrink: 0;
}

.search-body { max-height: 360px; overflow-y: auto; }

.search-empty {
  padding: 24px 16px;
  text-align: center;
  font-size: 13px;
  color: var(--zc-text-faint);
}

.search-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
  font-size: 12.5px;
  color: var(--zc-text-faint);
}

.search-results { padding: 6px; }

.search-result {
  display: flex;
  flex-direction: column;
  gap: 3px;
  width: 100%;
  padding: 9px 12px;
  background: transparent;
  border: 0;
  border-radius: var(--zc-r);
  text-align: left;
  cursor: pointer;
  transition: background 80ms;
}
.search-result:hover,
.search-result.active { background: var(--zc-hover); }

.search-result-title { font-size: 13.5px; color: var(--zc-text); font-weight: 500; }

.search-result-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
  color: var(--zc-text-dim);
}

.search-result-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.search-result-proj { font-weight: 500; }
.search-sep { color: var(--zc-text-faint); }
.search-result-col { font-family: var(--zc-mono); font-size: 10.5px; }

.search-result-pri {
  margin-left: auto;
  font-size: 10px;
  font-family: var(--zc-mono);
  text-transform: uppercase;
  padding: 1px 6px;
  border-radius: 3px;
}
.search-result-pri.pri-high   { background: color-mix(in srgb, var(--zc-danger)  15%, transparent); color: var(--zc-danger);  }
.search-result-pri.pri-medium { background: color-mix(in srgb, var(--zc-warning) 15%, transparent); color: var(--zc-warning); }
.search-result-pri.pri-low    { background: color-mix(in srgb, var(--zc-success) 15%, transparent); color: var(--zc-success); }

.search-fade-enter-active,
.search-fade-leave-active { transition: opacity 150ms, transform 150ms; }
.search-fade-enter-from,
.search-fade-leave-to     { opacity: 0; transform: translateY(-8px); }
</style>
