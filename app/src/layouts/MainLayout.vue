<template>
  <q-layout
    view="hHh Lpr lFf"
    class="zc-app"
    :class="{ 'theme-pixel': theme === 'pixel' }"
  >
    <q-header class="app-header">
      <AppTitlebar />
    </q-header>

    <q-drawer :width="64" :breakpoint="0" show-if-above>
      <AppSidebar />
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>

    <SearchOverlay />
  </q-layout>
</template>

<script setup>
import AppTitlebar   from 'src/components/common/AppTitlebar.vue'
import AppSidebar    from 'src/components/common/AppSidebar.vue'
import SearchOverlay from 'src/components/common/SearchOverlay.vue'
import { useSettings } from 'src/domains/settings/useSettings'

const { theme } = useSettings()
</script>

<style scoped>
:global(.app-header) {
  background: transparent !important;
  box-shadow: none !important;
  padding: 0 !important;
}
</style>
