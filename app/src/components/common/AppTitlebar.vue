<template>
  <div class="app-titlebar">

    <div class="app-tb-drag">
      <svg class="app-tb-logo" width="18" height="18" viewBox="0 0 24 24" fill="none">
        <defs>
          <linearGradient id="tbZ" x1="4" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
            <stop stop-color="#4dabf7" />
            <stop offset="1" stop-color="#7c6af7" />
          </linearGradient>
        </defs>
        <polyline
          points="4,5 20,5 4,19 20,19"
          stroke="url(#tbZ)"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <span class="app-tb-name">zntt-control</span>
    </div>

    <div class="app-tb-controls">
      <button class="app-tb-btn" title="Minimize" @click="winMinimize()">
        <ZIcon name="winMin" :size="10" :stroke="2" />
      </button>
      <button class="app-tb-btn" title="Maximize / Restore" @click="winMaximize()">
        <ZIcon :name="isMaximized ? 'winRestore' : 'winMax'" :size="10" :stroke="1.8" />
      </button>
      <button class="app-tb-btn close" title="Close" @click="winClose()">
        <ZIcon name="x" :size="11" :stroke="2" />
      </button>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useApp } from 'src/domains/app/useApp'
import ZIcon from './ZIcon.vue'

const { winMinimize, winMaximize, winClose, winIsMaximized, onMaximizeChange } = useApp()
const isMaximized = ref(false)

let unsubscribe = null

onMounted(async () => {
  try {
    isMaximized.value = await winIsMaximized()
    unsubscribe = await onMaximizeChange((val) => { isMaximized.value = val })
  } catch (_) {
    // show error if exists
  }
})

onBeforeUnmount(() => {
  if (typeof unsubscribe === 'function') unsubscribe()
})
</script>

<style scoped>
.app-titlebar {
  height: 36px;
  background: var(--zc-bg);
  border-bottom: 1px solid var(--zc-border);
  display: flex;
  align-items: stretch;
  flex-shrink: 0;
  user-select: none;
}

.app-tb-drag {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 14px;
  -webkit-app-region: drag;
}

.app-tb-logo { flex-shrink: 0; }

.app-tb-name {
  font-family: var(--zc-mono);
  font-size: 11px;
  font-weight: 600;
  color: var(--zc-text-faint);
  letter-spacing: 0.05em;
}

.app-tb-controls {
  display: flex;
  -webkit-app-region: no-drag;
}

.app-tb-btn {
  width: 46px;
  height: 100%;
  background: transparent;
  border: 0;
  color: var(--zc-text-dim);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 100ms, color 100ms;
}

.app-tb-btn:hover { background: var(--zc-hover); color: var(--zc-text); }
.app-tb-btn.close:hover { background: #c42b1c; color: #ffffff; }
</style>
