<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue'
import { useSettings } from 'src/domains/settings/useSettings'

const { init } = useSettings()

onMounted(async () => {
  // await initDb()
  await init()
})
</script>
