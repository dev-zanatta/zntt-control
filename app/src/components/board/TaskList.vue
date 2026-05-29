<template>
  <VueDraggable
    v-model="localTasks"
    class="zc-col-body"
    :group="{ name: 'kanban-tasks', pull: true, put: true }"
    handle=".zc-tcard-grip"
    ghost-class="tcard-ghost"
    :animation="150"
    :data-col-id="colId"
    @update="onSortEnd"
    @add="onItemAdded"
  >
    <TaskCard
      v-for="task in localTasks"
      :key="task.id"
      :task="task"
      :data-task-id="task.id"
      @click="$emit('task-click', task)"
    />
  </VueDraggable>
</template>

<script setup>
import { computed } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import TaskCard from './TaskCard.vue'

const props = defineProps({
  tasks: { type: Array,  required: true },
  colId: { type: Number, required: true },
})

const emit = defineEmits(['task-click', 'update:tasks', 'reorder', 'moved'])

const localTasks = computed({
  get: () => props.tasks,
  set: (val) => emit('update:tasks', val),
})

function onSortEnd(evt) {
  emit('reorder', {
    colId:    props.colId,
    oldIndex: evt.oldIndex,
    newIndex: evt.newIndex,
  })
}

function onItemAdded(evt) {
  const taskId    = parseInt(evt.item.getAttribute('data-task-id'))
  const fromColId = parseInt(evt.from.getAttribute('data-col-id'))
  emit('moved', { taskId, fromColId, toColId: props.colId, newIndex: evt.newIndex })
}
</script>
