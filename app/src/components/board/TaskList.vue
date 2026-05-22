<template>
  <div ref="listEl" class="zc-col-body">
    <TaskCard
      v-for="task in tasks"
      :key="task.id"
      :task="task"
      :data-task-id="task.id"
      @click="$emit('task-click', task)"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import Sortable from 'sortablejs'
import TaskCard from './TaskCard.vue'

const props = defineProps({
  tasks:  { type: Array,  required: true },
  colId:  { type: Number, required: true },
})

const emit = defineEmits(['task-click', 'reorder', 'moved'])

const listEl = ref(null)
let sortable = null

function init() {
  if (!listEl.value) return
  sortable?.destroy()

  sortable = Sortable.create(listEl.value, {
    group:      'kanban-tasks',
    handle:     '.zc-tcard-grip',
    ghostClass: 'tcard-ghost',
    animation:  150,
    // data attribute on the container so onAdd knows the source column
    dataIdAttr: 'data-task-id',

    // Reorder within this column
    onUpdate(evt) {
      emit('reorder', {
        colId:    props.colId,
        oldIndex: evt.oldIndex,
        newIndex: evt.newIndex,
      })
    },

    // Task dragged FROM another column INTO this one
    onAdd(evt) {
      const taskId = parseInt(evt.item.getAttribute('data-task-id'))
      const fromColId = parseInt(evt.from.getAttribute('data-col-id'))
      const newIndex  = evt.newIndex

      // Remove the DOM node SortableJS moved — Vue will re-render it correctly
      // once we update the reactive model in the parent
      evt.item.parentNode?.removeChild(evt.item)

      emit('moved', { taskId, fromColId, toColId: props.colId, newIndex })
    },
  })

  // Stamp the container with its column ID so onAdd can read it
  listEl.value.setAttribute('data-col-id', props.colId)
}

onMounted(init)

// Re-init when the column ID changes (rare, but safe)
watch(() => props.colId, init)

onBeforeUnmount(() => sortable?.destroy())
</script>
