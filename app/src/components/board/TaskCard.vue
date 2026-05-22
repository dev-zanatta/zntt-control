<template>
  <article
    :class="['zc-tcard', dragging ? 'dragging' : '']"
    @click="$emit('click')"
  >
    <div class="zc-tcard-grip">
      <ZIcon name="grip" :size="12" :stroke="1" />
    </div>

    <h4 class="zc-tcard-title">{{ task.title }}</h4>

    <div class="zc-tcard-meta">
      <span v-if="task.priority" :class="['zc-badge', 'pri-' + task.priority]">
        <span class="dot" />
        {{ task.priority }}
      </span>

      <span v-if="task.attachment_count > 0" class="zc-tcard-meta-item">
        <ZIcon name="paperclip" :size="11" />
        {{ task.attachment_count }}
      </span>

      <span v-if="task.subtask_count > 0" class="zc-tcard-meta-item">
        <ZIcon name="checklist" :size="11" />
        {{ task.subtask_done || 0 }}/{{ task.subtask_count }}
      </span>

      <span class="spacer" />

      <span
        v-if="task.due_date"
        :class="['zc-tcard-due', isOverdue ? 'overdue' : '']"
      >
        {{ formattedDue }}
      </span>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import ZIcon from 'src/components/common/ZIcon.vue'

const props = defineProps({
  task: { type: Object, required: true },
  dragging: { type: Boolean, default: false },
})

defineEmits(['click'])

const formattedDue = computed(() => {
  if (!props.task.due_date) return null
  const d = new Date(props.task.due_date + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
})

const isOverdue = computed(() => {
  if (!props.task.due_date) return false
  return new Date(props.task.due_date + 'T23:59:59') < new Date()
})
</script>
