<template>
  <div class="zc-modal-overlay zc-fade" @click.self="$emit('close')">
    <div class="zc-modal join-modal" @click.stop>

      <div class="zc-modal-hd">
        <div class="zc-modal-title">Join a project</div>
        <button class="zc-modal-x" @click="$emit('close')">
          <ZIcon name="x" :size="14" />
        </button>
      </div>

      <div class="zc-modal-body">
        <p class="join-hint">
          Ask the project owner for their 8-character invite code and enter it below.
        </p>

        <div class="join-field">
          <input
            ref="inputRef"
            v-model="code"
            class="zc-input code-input"
            placeholder="ABCD1234"
            maxlength="8"
            autocomplete="off"
            spellcheck="false"
            :disabled="success"
            @input="onInput"
            @keydown.enter="handleJoin"
          />
        </div>

        <p v-if="error" class="join-error">{{ error }}</p>

        <div v-if="success" class="join-success">
          <ZIcon name="check-circle" :size="16" />
          Request sent for <strong>{{ projectName }}</strong>. Wait for the owner to approve.
        </div>
      </div>

      <div class="zc-modal-ft">
        <button class="zc-btn ghost" @click="$emit('close')">{{ success ? 'Close' : 'Cancel' }}</button>
        <button
          v-if="!success"
          class="zc-btn primary"
          :disabled="code.length !== 8 || loading"
          @click="handleJoin"
        >
          <ZIcon v-if="loading" name="loader" :size="13" class="spin" />
          {{ loading ? 'Sending…' : 'Send request' }}
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { nextTick, onMounted, ref } from 'vue'
import { useProject } from 'src/domains/project/useProject'
import ZIcon from 'src/components/common/ZIcon.vue'

defineEmits(['close'])

const { joinProject } = useProject()

const code        = ref('')
const loading     = ref(false)
const error       = ref('')
const success     = ref(false)
const projectName = ref('')
const inputRef    = ref(null)

onMounted(() => nextTick(() => inputRef.value?.focus()))

function onInput() {
  code.value = code.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
  error.value = ''
}

async function handleJoin() {
  if (code.value.length !== 8 || loading.value) return
  loading.value = true
  error.value = ''
  try {
    const res = await joinProject(code.value)
    projectName.value = res.project_name || ''
    success.value = true
  } catch (e) {
    const detail = e?.response?.data?.detail
    error.value = detail || 'Invalid code or request already sent.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.join-modal { max-width: 360px; width: 100%; }

.join-hint {
  font-size: 13px;
  color: var(--zc-text-dim);
  margin: 0 0 16px;
  line-height: 1.5;
}

.join-field { margin-bottom: 8px; }

.code-input {
  font-family: monospace;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: .2em;
  text-align: center;
  text-transform: uppercase;
  width: 100%;
}

.join-error {
  font-size: 12px;
  color: var(--q-negative);
  margin: 4px 0 0;
}

.join-success {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
  color: var(--q-positive);
  background: color-mix(in srgb, var(--q-positive) 12%, transparent);
  border-radius: 8px;
  padding: 10px 12px;
  margin-top: 10px;
  line-height: 1.5;
}

.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
