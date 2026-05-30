<template>
  <div class="zc-modal-overlay zc-fade" @click.self="$emit('close')">
    <div class="zc-modal share-modal" @click.stop>

      <div class="zc-modal-hd">
        <div class="zc-modal-title">Share project</div>
        <button class="zc-modal-x" @click="$emit('close')">
          <ZIcon name="x" :size="14" />
        </button>
      </div>

      <div class="zc-modal-body">

        <!-- Invite code -->
        <section class="share-section">
          <p class="share-label">Invite code</p>
          <p class="share-hint">Share this code with anyone you want to give access to.</p>

          <div class="code-row">
            <span class="invite-code">{{ inviteCode || '——————' }}</span>
            <button class="zc-btn ghost sm" :disabled="!inviteCode" @click="copyCode">
              <ZIcon :name="copied ? 'check' : 'copy'" :size="13" />
              {{ copied ? 'Copied!' : 'Copy' }}
            </button>
          </div>

          <button class="zc-btn ghost sm refresh-btn" :disabled="refreshing" @click="handleRefresh">
            <ZIcon name="refresh-cw" :size="13" />
            {{ refreshing ? 'Refreshing…' : 'Refresh code' }}
          </button>
          <p v-if="refreshed" class="share-warn">
            Old code is now invalid. Pending requests were rejected.
          </p>
        </section>

        <!-- Pending requests -->
        <section v-if="pending.length" class="share-section">
          <p class="share-label">Pending requests <span class="badge">{{ pending.length }}</span></p>
          <ul class="member-list">
            <li v-for="m in pending" :key="m.id" class="member-item">
              <div class="member-info">
                <span class="member-name">{{ m.username }}</span>
                <span class="member-email">{{ m.email }}</span>
              </div>
              <div class="member-actions">
                <button class="zc-btn primary sm" @click="accept(m)">Accept</button>
                <button class="zc-btn ghost sm" @click="reject(m)">Reject</button>
              </div>
            </li>
          </ul>
        </section>

        <!-- Current members -->
        <section class="share-section">
          <p class="share-label">Members <span class="badge">{{ accepted.length }}</span></p>
          <template v-if="accepted.length === 0">
            <p class="share-empty">No members yet.</p>
          </template>
          <ul v-else class="member-list">
            <li v-for="m in accepted" :key="m.id" class="member-item">
              <div class="member-info">
                <span class="member-name">{{ m.username }}</span>
                <span class="member-email">{{ m.email }}</span>
              </div>
              <button class="zc-btn ghost sm danger-txt" @click="remove(m)">Remove</button>
            </li>
          </ul>
        </section>

        <p v-if="error" class="share-error">{{ error }}</p>
      </div>

    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useProject } from 'src/domains/project/useProject'
import ZIcon from 'src/components/common/ZIcon.vue'

const props = defineProps({
  projectId: { type: String, required: true },
})
defineEmits(['close'])

const { getInviteCode, refreshInviteCode, getMembers, acceptMember, rejectMember, removeMember } = useProject()

const inviteCode = ref('')
const members    = ref([])
const copied     = ref(false)
const refreshing = ref(false)
const refreshed  = ref(false)
const error      = ref('')

const pending  = computed(() => members.value.filter((m) => m.status === 'pending'))
const accepted = computed(() => members.value.filter((m) => m.status === 'accepted'))

onMounted(async () => {
  try {
    const [code, mList] = await Promise.all([
      getInviteCode(props.projectId),
      getMembers(props.projectId),
    ])
    inviteCode.value = code
    members.value = mList
  } catch (e) {
    error.value = 'Failed to load sharing data.'
  }
})

async function copyCode() {
  try {
    await navigator.clipboard.writeText(inviteCode.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    error.value = 'Could not copy to clipboard.'
  }
}

async function handleRefresh() {
  if (!confirm('This will invalidate the current code and reject all pending requests. Continue?')) return
  refreshing.value = true
  refreshed.value = false
  error.value = ''
  try {
    inviteCode.value = await refreshInviteCode(props.projectId)
    members.value = members.value.filter((m) => m.status !== 'pending')
    refreshed.value = true
  } catch {
    error.value = 'Failed to refresh code.'
  } finally {
    refreshing.value = false
  }
}

async function accept(member) {
  error.value = ''
  try {
    await acceptMember(props.projectId, member.usuario)
    const idx = members.value.findIndex((m) => m.id === member.id)
    if (idx !== -1) members.value[idx] = { ...member, status: 'accepted' }
  } catch {
    error.value = 'Failed to accept request.'
  }
}

async function reject(member) {
  error.value = ''
  try {
    await rejectMember(props.projectId, member.usuario)
    members.value = members.value.filter((m) => m.id !== member.id)
  } catch {
    error.value = 'Failed to reject request.'
  }
}

async function remove(member) {
  if (!confirm(`Remove ${member.username} from this project?`)) return
  error.value = ''
  try {
    await removeMember(props.projectId, member.usuario)
    members.value = members.value.filter((m) => m.id !== member.id)
  } catch {
    error.value = 'Failed to remove member.'
  }
}
</script>

<style scoped>
.share-modal { max-width: 440px; width: 100%; }

.share-section {
  padding: 14px 0;
  border-bottom: 1px solid var(--zntt-border);
}
.share-section:last-of-type { border-bottom: none; }

.share-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .05em;
  color: var(--zc-text-faint);
  margin: 0 0 4px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.share-hint {
  font-size: 12px;
  color: var(--zc-text-dim);
  margin: 0 0 10px;
}

.code-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.invite-code {
  font-family: monospace;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: .15em;
  color: var(--zntt-accent);
  background: var(--zntt-bg-surface);
  border: 1px solid var(--zntt-border);
  border-radius: 6px;
  padding: 6px 14px;
  flex: 1;
  text-align: center;
}

.refresh-btn { color: var(--zc-text-dim); font-size: 11px; }

.share-warn {
  font-size: 11px;
  color: var(--q-warning);
  margin: 4px 0 0;
}

.badge {
  background: var(--zntt-accent);
  color: #fff;
  border-radius: 10px;
  padding: 1px 7px;
  font-size: 10px;
}

.member-list { list-style: none; margin: 8px 0 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }

.member-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.member-info { display: flex; flex-direction: column; gap: 1px; }
.member-name { font-size: 13px; font-weight: 500; color: var(--zc-text); }
.member-email { font-size: 11px; color: var(--zc-text-faint); }
.member-actions { display: flex; gap: 6px; }

.share-empty { font-size: 12px; color: var(--zc-text-faint); margin: 6px 0 0; }

.danger-txt { color: var(--q-negative) !important; }

.share-error {
  font-size: 12px;
  color: var(--q-negative);
  margin: 10px 0 0;
}
</style>
