<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue'
import { useUiStore } from 'src/stores/uiStore'

const uiStore = useUiStore()

onMounted(async () => {
  await uiStore.initTheme()
})
</script>
