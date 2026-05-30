<template>
  <q-layout view="hHh lpr lFf" class="zc-app">
    <q-header class="app-header">
      <AppTitlebar />
    </q-header>
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import AppTitlebar from 'src/components/common/AppTitlebar.vue'
</script>

<style scoped>
:global(.app-header) {
  background: transparent !important;
  box-shadow: none !important;
  padding: 0 !important;
}
</style>
