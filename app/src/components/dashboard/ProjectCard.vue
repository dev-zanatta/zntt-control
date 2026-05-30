<template>
  <article
    :class="['zc-pcard', project.status]"
    :style="{ '--zc-pcard-color': project.color }"
    @click="$emit('click')"
  >
    <div class="zc-pcard-top">
      <div class="zc-pcard-logo">
        <img v-if="project.logo_path" :src="logoSrc" :alt="project.name" style="width:100%;height:100%;object-fit:cover;border-radius:8px;" />
        <span v-else>{{ initials }}</span>
      </div>
      <div class="zc-pcard-headline">
        <h3 class="zc-pcard-name">{{ project.name }}</h3>
        <div class="zc-pcard-cat">{{ project.category_name || '—' }}</div>
      </div>
      <span v-if="project.status !== 'active'" :class="['zc-badge', 'status-' + project.status]">
        {{ project.status === 'paused' ? 'paused' : 'done' }}
      </span>
    </div>

    <div class="zc-progress">
      <i :style="{ width: pct + '%', background: project.color }" />
    </div>

    <div class="zc-pcard-stats">
      <span>{{ project.done_tasks || 0 }}/{{ project.total_tasks || 0 }} tasks</span>
      <span>{{ pct }}%</span>
    </div>

    <div class="zc-pcard-actions" @click.stop>
      <button class="zc-btn icon" title="Settings" @click="$emit('settings')">
        <ZIcon name="settings" :size="13" />
      </button>
      <button
        v-if="project.is_owner"
        class="zc-btn icon"
        title="Share project"
        @click="$emit('share')"
      >
        <ZIcon name="share-2" :size="13" />
      </button>
      <button class="zc-btn icon" :title="project.status === 'paused' ? 'Resume' : 'Pause'" @click="$emit('toggle-status')">
        <ZIcon :name="project.status === 'paused' ? 'play' : 'pause'" :size="13" />
      </button>
      <button class="zc-btn icon" title="Delete" @click="$emit('delete')">
        <ZIcon name="trash" :size="13" />
      </button>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import { convertFileSrc } from '@tauri-apps/api/core'
import ZIcon from 'src/components/common/ZIcon.vue'

const props = defineProps({
  project: { type: Object, required: true },
})

defineEmits(['click', 'settings', 'share', 'toggle-status', 'delete'])

const initials = computed(() =>
  (props.project.name || 'P').slice(0, 2).toUpperCase()
)

const pct = computed(() => {
  const total = props.project.total_tasks || 0
  const done = props.project.done_tasks || 0
  return total > 0 ? Math.round((done / total) * 100) : 0
})

const logoSrc = computed(() => {
  const p = props.project.logo_path
  if (!p) return null
  if (p.startsWith('blob:') || p.startsWith('data:')) return p
  return convertFileSrc(p)
})
</script>
