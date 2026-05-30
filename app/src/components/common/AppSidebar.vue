<template>
  <div class="zc-sidebar">

    <div class="zc-sb-logo">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <defs>
          <linearGradient id="sbZ" x1="4" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
            <stop stop-color="#4dabf7" />
            <stop offset="1" stop-color="#7c6af7" />
          </linearGradient>
        </defs>
        <polyline
          points="4,5 20,5 4,19 20,19"
          stroke="url(#sbZ)"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </div>

    <button
      class="zc-sb-item"
      :class="{ active: route.name === 'dashboard' || route.name === 'project-board' }"
      title="Dashboard"
      @click="router.push({ name: 'dashboard' })"
    >
      <ZIcon name="grid" :size="18" />
    </button>

    <button
      class="zc-sb-item"
      title="Search tasks (Ctrl+K)"
      @click="openSearch()"
    >
      <ZIcon name="search" :size="17" />
    </button>

    <button
      class="zc-sb-item"
      :class="{ active: route.name === 'settings' }"
      title="Settings"
      @click="router.push({ name: 'settings' })"
    >
      <ZIcon name="settings" :size="18" />
    </button>

    <div class="zc-sb-spacer" />

    <button
      class="zc-sb-item"
      title="Sign out"
      @click="handleLogout"
    >
      <ZIcon name="log-out" :size="17" />
    </button>
  </div>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'
import { useSettings } from 'src/domains/settings/useSettings'
import { AuthService } from 'src/domains/auth/auth.service'
import ZIcon from 'src/components/common/ZIcon.vue'

const route  = useRoute()
const router = useRouter()
const { openSearch } = useSettings()

async function handleLogout() {
  await AuthService.logout()
  router.push({ name: 'login' })
}
</script>

<style scoped>
.zc-sidebar {
  width: 64px;
  height: 100%;
  background: var(--zntt-bg-primary);
  border-right: 1px solid var(--zntt-border);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 0;
  gap: 4px;
  flex-shrink: 0;
}

.zc-sb-logo {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
}

.zc-sb-item {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: 0;
  background: transparent;
  color: var(--zntt-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: background var(--zntt-transition), color var(--zntt-transition);
}

.zc-sb-item:hover { background: var(--zntt-bg-hover); color: var(--zntt-text-primary); }

.zc-sb-item.active {
  color: var(--zntt-text-primary);
  background: var(--zntt-bg-surface);
}

.zc-sb-item.active::before {
  content: '';
  position: absolute;
  left: -12px;
  top: 10px;
  bottom: 10px;
  width: 2px;
  border-radius: 2px;
  background: var(--zntt-accent);
}

.zc-sb-spacer { flex: 1; }
</style>
