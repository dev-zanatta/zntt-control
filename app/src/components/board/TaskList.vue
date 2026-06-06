<template>
  <VueDraggable
    v-model="localTasks"
    class="zc-col-body"
    :group="{ name: 'kanban-tasks', pull: true, put: true }"
    ghost-class="tcard-ghost"
    :animation="150"
    :force-fallback="true"
    :fallback-on-body="true"
    :data-col-id="colId"
    @start="onDragStart"
    @end="onDragEnd"
    @update="onSortEnd"
    @add="onItemAdded"
  >
    <TaskCard
      v-for="task in localTasks"
      :key="task.id"
      :task="task"
      :data-task-id="task.id"
      @click="onTaskClick(task)"
    />
  </VueDraggable>
</template>

<script setup>
import { ref, computed } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import TaskCard from './TaskCard.vue'

const props = defineProps({
  tasks: { type: Array,  required: true },
  colId: { type: String, required: true },
})

const emit = defineEmits(['task-click', 'update:tasks', 'reorder', 'moved'])

const localTasks = computed({
  get: () => props.tasks,
  set: (val) => emit('update:tasks', val),
})

const dragging = ref(false)

function onDragStart() {
  dragging.value = true
}

function onDragEnd() {
  setTimeout(() => { dragging.value = false }, 100)
}

function onTaskClick(task) {
  if (!dragging.value) emit('task-click', task)
}

function onSortEnd(evt) {
  emit('reorder', {
    colId:    props.colId,
    oldIndex: evt.oldIndex,
    newIndex: evt.newIndex,
  })
}

function onItemAdded(evt) {
  const taskId    = evt.item.getAttribute('data-task-id')
  const fromColId = evt.from.getAttribute('data-col-id')
  emit('moved', { taskId, fromColId, toColId: props.colId, newIndex: evt.newIndex })
}
</script>
