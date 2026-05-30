<template>
  <q-page class="login-page">
    <div class="login-card">

      <!-- Logo -->
      <div class="login-logo">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <defs>
            <linearGradient id="lgZ" x1="4" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
              <stop stop-color="#4dabf7" />
              <stop offset="1" stop-color="#7c6af7" />
            </linearGradient>
          </defs>
          <polyline
            points="4,5 20,5 4,19 20,19"
            stroke="url(#lgZ)"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>

      <h1 class="login-title">zntt-control</h1>
      <p class="login-sub">Sign in to your account</p>

      <form class="login-form" @submit.prevent="handleLogin">

        <div class="login-field">
          <label class="zc-label" for="login-username">Username</label>
          <input
            id="login-username"
            v-model="username"
            class="zc-input"
            type="text"
            placeholder="your username"
            autocomplete="username"
            autofocus
            :disabled="loading"
          />
        </div>

        <div class="login-field">
          <label class="zc-label" for="login-password">Password</label>
          <div class="pw-wrap">
            <input
              id="login-password"
              v-model="password"
              class="zc-input"
              :type="showPw ? 'text' : 'password'"
              placeholder="••••••••"
              autocomplete="current-password"
              :disabled="loading"
            />
            <button
              type="button"
              class="pw-toggle"
              :title="showPw ? 'Hide' : 'Show'"
              tabindex="-1"
              @click="showPw = !showPw"
            >
              <ZIcon :name="showPw ? 'eye-off' : 'eye'" :size="14" />
            </button>
          </div>
        </div>

        <p v-if="error" class="login-error">{{ error }}</p>

        <button
          type="submit"
          class="zc-btn primary lg login-submit"
          :disabled="loading || !username || !password"
        >
          <ZIcon v-if="loading" name="loader" :size="14" class="spin" />
          {{ loading ? 'Signing in…' : 'Sign in' }}
        </button>

      </form>

      <p class="login-hint">
        Don't have an account?
        <a href="#" class="login-link" @click.prevent>Ask the administrator.</a>
      </p>
    </div>

    <!-- Subtle grid background -->
    <div class="login-bg-grid" aria-hidden="true" />
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { AuthService } from 'src/domains/auth/auth.service'
import ZIcon from 'src/components/common/ZIcon.vue'

const router = useRouter()

const username = ref('')
const password = ref('')
const showPw   = ref(false)
const loading  = ref(false)
const error    = ref('')

async function handleLogin() {
  if (loading.value || !username.value || !password.value) return
  loading.value = true
  error.value   = ''
  try {
    await AuthService.login(username.value, password.value)
    router.push('/')
  } catch (e) {
    const detail = e?.response?.data?.detail
    if (detail) {
      error.value = detail
    } else if (e?.response?.status === 401) {
      error.value = 'Invalid username or password.'
    } else {
      error.value = 'Could not connect to the server.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: var(--zntt-bg-primary);
  position: relative;
  overflow: hidden;
}

/* Subtle dot-grid background */
.login-bg-grid {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle, var(--zntt-border) 1px, transparent 1px);
  background-size: 28px 28px;
  opacity: 0.5;
  pointer-events: none;
}

/* Radial glow behind the card */
.login-page::before {
  content: '';
  position: absolute;
  width: 480px;
  height: 480px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--zntt-accent-muted) 0%, transparent 70%);
  pointer-events: none;
}

.login-card {
  position: relative;
  z-index: 1;
  width: 340px;
  background: var(--zntt-bg-surface);
  border: 1px solid var(--zntt-border);
  border-radius: 14px;
  padding: 36px 32px 28px;
  box-shadow: var(--zntt-shadow-lg);
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* Logo */
.login-logo {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  background: var(--zntt-bg-surface-2);
  border: 1px solid var(--zntt-border);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 18px;
}

.login-title {
  font-family: var(--zntt-font-mono);
  font-size: 18px;
  font-weight: 700;
  color: var(--zntt-text-primary);
  margin: 0 0 4px;
  letter-spacing: -0.01em;
}

.login-sub {
  font-size: 12px;
  color: var(--zntt-text-secondary);
  margin: 0 0 28px;
}

/* Form */
.login-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.login-field {
  display: flex;
  flex-direction: column;
}

/* Password toggle */
.pw-wrap {
  position: relative;
}
.pw-wrap .zc-input {
  padding-right: 36px;
}
.pw-toggle {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--zntt-text-secondary);
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  transition: color 0.12s;
}
.pw-toggle:hover { color: var(--zntt-text-primary); }

/* Error */
.login-error {
  font-size: 12px;
  color: var(--zntt-danger);
  margin: -4px 0 0;
  padding: 8px 10px;
  background: var(--zntt-danger-muted);
  border-radius: 6px;
  border: 1px solid rgba(224, 92, 92, 0.2);
}

/* Submit button */
.login-submit {
  width: 100%;
  justify-content: center;
  height: 38px;
  font-size: 13px;
  margin-top: 4px;
  letter-spacing: 0.01em;
}
.login-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  filter: none;
}

/* Hint */
.login-hint {
  font-size: 11.5px;
  color: var(--zntt-text-secondary);
  margin: 20px 0 0;
  text-align: center;
}
.login-link {
  color: var(--zntt-accent);
  text-decoration: none;
}
.login-link:hover { text-decoration: underline; }

/* Spinner */
.spin { animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
