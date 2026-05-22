<template>
  <!--
    class="zc-app" — root anchor for the zc-* design system (fonts, resets, component overrides)
    theme-pixel class is toggled reactively so design.css .zc-app.theme-pixel selectors work
  -->
  <q-layout
    view="hHh Lpr lFf"
    class="zc-app"
    :class="{ 'theme-pixel': uiStore.theme === 'pixel' }"
  >

    <!-- Full-width custom titlebar (view="hHh" makes it span over the drawer column) -->
    <q-header class="app-header">
      <AppTitlebar />
    </q-header>

    <!-- Sidebar -->
    <q-drawer :width="64" :breakpoint="0" show-if-above>
      <AppSidebar />
    </q-drawer>

    <!-- Main content -->
    <q-page-container>
      <router-view />
    </q-page-container>

    <!-- Global search overlay (teleports to body) -->
    <SearchOverlay />

  </q-layout>
</template>

<script setup>
import { onMounted } from 'vue'
import AppTitlebar   from 'src/components/common/AppTitlebar.vue'
import AppSidebar    from 'src/components/common/AppSidebar.vue'
import SearchOverlay from 'src/components/common/SearchOverlay.vue'
import { useUiStore } from 'src/stores/uiStore'

const uiStore = useUiStore()

onMounted(async () => {
  // Restore persisted theme + accent from database on every app launch
  await uiStore.initTheme()
})
</script>

<style scoped>
/* Strip Quasar's default q-header chrome — AppTitlebar owns its own look */
:global(.app-header) {
  background: transparent !important;
  box-shadow: none !important;
  padding: 0 !important;
}
</style>
