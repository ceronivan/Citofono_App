<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const showPassword = ref(false)

const ERRORS: Record<string, string> = {
  'auth/invalid-credential': 'Correo o contraseña incorrectos',
  'auth/user-disabled': 'Esta cuenta ha sido desactivada',
  'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde',
  'auth/network-request-failed': 'Sin conexión a internet',
}

const DASHBOARD: Record<string, string> = {
  resident: '/', admin: '/admin', guard: '/guard',
}

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    const user = await authStore.login(email.value.trim(), password.value)
    const role = user.memberships?.[0]?.role ?? user.role
    router.push(DASHBOARD[role])
  } catch (e: any) {
    error.value = ERRORS[e?.code] ?? 'Error al iniciar sesión'
  } finally {
    loading.value = false
  }
}

// ── Modo demo: acceso rápido con cuentas de prueba ────────────────────────────
const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true'
const demoLoading = ref('')

const DEMO_ACCOUNTS = [
  { email: 'residente@demo.com', label: 'Residente', icon: 'mdi-account-outline', color: '#4F35E8' },
  { email: 'admin@demo.com', label: 'Admin', icon: 'mdi-shield-crown-outline', color: '#0EA5E9' },
  { email: 'portero@demo.com', label: 'Portería', icon: 'mdi-security', color: '#10B981' },
]

async function demoLogin(demoEmail: string) {
  demoLoading.value = demoEmail
  error.value = ''
  try {
    const user = await authStore.login(demoEmail, 'demo123')
    const role = user.memberships?.[0]?.role ?? user.role
    router.push(DASHBOARD[role])
  } catch {
    error.value = 'Error al iniciar la demo'
  } finally {
    demoLoading.value = ''
  }
}
</script>

<template>
  <div class="login-shell">
    <!-- Background decoration -->
    <div class="login-bg-blob" aria-hidden="true" />

    <div class="login-content">
      <!-- Brand -->
      <div class="login-brand">
        <div class="login-logo">
          <VIcon icon="mdi-shield-home" size="32" color="white" />
        </div>
        <h1 class="login-app-name">PortalResidencial</h1>
        <p class="login-tagline">Gestión inteligente de tu conjunto</p>
      </div>

      <!-- Card -->
      <div class="login-card">
        <h2 class="login-card-title">Bienvenido</h2>
        <p class="login-card-subtitle">Ingresa con tu cuenta para continuar</p>

        <!-- Error -->
        <div v-if="error" class="login-error" role="alert">
          <VIcon icon="mdi-alert-circle-outline" size="16" />
          <span>{{ error }}</span>
          <button class="login-error-close" @click="error = ''">
            <VIcon icon="mdi-close" size="14" />
          </button>
        </div>

        <form @submit.prevent="handleLogin" class="login-form" novalidate>
          <div class="field-group">
            <label class="field-label" for="login-email">Correo electrónico</label>
            <div class="field-wrap" :class="{ 'field-wrap--disabled': loading }">
              <VIcon icon="mdi-email-outline" size="18" class="field-icon" />
              <input
                id="login-email"
                v-model="email"
                type="email"
                class="field-input"
                placeholder="tu@correo.com"
                autocomplete="email"
                :disabled="loading"
              />
            </div>
          </div>

          <div class="field-group">
            <label class="field-label" for="login-password">Contraseña</label>
            <div class="field-wrap" :class="{ 'field-wrap--disabled': loading }">
              <VIcon icon="mdi-lock-outline" size="18" class="field-icon" />
              <input
                id="login-password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                class="field-input"
                placeholder="••••••••"
                autocomplete="current-password"
                :disabled="loading"
              />
              <button
                type="button"
                class="field-toggle"
                @click="showPassword = !showPassword"
                :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
              >
                <VIcon
                  :icon="showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
                  size="18"
                />
              </button>
            </div>
          </div>

          <button
            type="submit"
            class="login-submit"
            :class="{ 'login-submit--loading': loading }"
            :disabled="loading || !email || !password"
          >
            <span v-if="!loading">Ingresar</span>
            <span v-else class="login-spinner" />
          </button>
        </form>

        <div class="login-links">
          <RouterLink to="/forgot-password" class="login-forgot">
            ¿Olvidaste tu contraseña?
          </RouterLink>
        </div>
      </div>

      <!-- Acceso rápido demo -->
      <div v-if="isDemoMode" class="demo-panel">
        <div class="demo-panel-head">
          <span class="demo-badge">DEMO</span>
          <span class="demo-panel-title">Explora la app con un toque</span>
        </div>
        <div class="demo-accounts">
          <button
            v-for="acc in DEMO_ACCOUNTS"
            :key="acc.email"
            class="demo-account"
            :style="{ '--acc': acc.color }"
            :disabled="!!demoLoading"
            @click="demoLogin(acc.email)"
          >
            <div class="demo-account-icon">
              <VIcon v-if="demoLoading !== acc.email" :icon="acc.icon" size="20" />
              <span v-else class="demo-spinner" />
            </div>
            <span>{{ acc.label }}</span>
          </button>
        </div>
      </div>

      <div class="login-register-cta">
        <span>¿Nuevo aquí?</span>
        <RouterLink to="/register" class="login-register-link">
          Regístrate con tu código de invitación
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-shell {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg);
  position: relative;
  overflow: hidden;
  padding: 24px 20px max(24px, env(safe-area-inset-bottom, 24px));
}

/* Decorative blob */
.login-bg-blob {
  position: absolute;
  top: -120px;
  left: 50%;
  transform: translateX(-50%);
  width: 500px;
  height: 500px;
  border-radius: 50%;
  background: radial-gradient(
    ellipse at center,
    rgba(79, 53, 232, 0.12) 0%,
    rgba(79, 53, 232, 0.04) 50%,
    transparent 70%
  );
  pointer-events: none;
}

.login-content {
  width: 100%;
  max-width: 380px;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

/* Brand section */
.login-brand {
  text-align: center;
  padding-top: 16px;
}

.login-logo {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #4F35E8 0%, #7B64F0 100%);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  box-shadow: 0 8px 24px rgba(79, 53, 232, 0.3);
}

.login-app-name {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.5px;
  margin: 0 0 6px;
}

.login-tagline {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin: 0;
}

/* Card */
.login-card {
  background: var(--color-surface);
  border-radius: 28px;
  padding: 28px 24px;
  box-shadow: var(--shadow-md);
}

.login-card-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.3px;
  margin: 0 0 4px;
}

.login-card-subtitle {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin: 0 0 24px;
}

/* Error */
.login-error {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--color-error-soft);
  color: #b91c1c;
  border-radius: 12px;
  padding: 10px 12px;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 20px;
}

.login-error span { flex: 1; }

.login-error-close {
  border: none;
  background: none;
  cursor: pointer;
  color: inherit;
  opacity: 0.6;
  display: flex;
  padding: 0;
}

/* Form */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.field-wrap {
  display: flex;
  align-items: center;
  background: var(--color-surface-2);
  border-radius: 14px;
  border: 1.5px solid transparent;
  padding: 0 14px;
  height: 52px;
  gap: 10px;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.field-wrap:focus-within {
  border-color: var(--color-primary);
  background: white;
}

.field-wrap--disabled {
  opacity: 0.5;
}

.field-icon {
  color: var(--color-text-tertiary);
  flex-shrink: 0;
}

.field-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 15px;
  font-family: inherit;
  color: var(--color-text-primary);
  outline: none;
  min-width: 0;
}

.field-input::placeholder {
  color: var(--color-text-disabled);
}

.field-toggle {
  border: none;
  background: none;
  cursor: pointer;
  color: var(--color-text-tertiary);
  display: flex;
  align-items: center;
  padding: 0;
  flex-shrink: 0;
}

/* Submit */
.login-submit {
  width: 100%;
  height: 52px;
  border: none;
  border-radius: 9999px;
  background: var(--color-primary);
  color: white;
  font-size: 15px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  margin-top: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.15s ease, transform 0.12s ease;
  letter-spacing: -0.1px;
}

.login-submit:hover { opacity: 0.92; }
.login-submit:active { transform: scale(0.98); }
.login-submit:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
}

/* Spinner */
.login-spinner {
  width: 20px;
  height: 20px;
  border: 2.5px solid rgba(255, 255, 255, 0.35);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Links */
.login-links {
  text-align: center;
  margin-top: 20px;
}

.login-forgot {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-primary);
  text-decoration: none;
}

.login-forgot:hover { opacity: 0.75; }

/* Register CTA */
.login-register-cta {
  text-align: center;
  font-size: 13px;
  color: var(--color-text-secondary);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.login-register-link {
  font-weight: 700;
  color: var(--color-primary);
  text-decoration: none;
}
.login-register-link:active { opacity: 0.7; }

/* ── Panel demo ── */
.demo-panel {
  background: var(--color-surface);
  border: 1.5px dashed var(--color-border);
  border-radius: 20px;
  padding: 14px 16px 16px;
}

.demo-panel-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.demo-badge {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1px;
  color: white;
  background: linear-gradient(135deg, #4F35E8, #7B64F0);
  border-radius: 6px;
  padding: 3px 8px;
}

.demo-panel-title {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.demo-accounts {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.demo-account {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 6px;
  border: none;
  border-radius: 14px;
  background: var(--color-surface-2);
  cursor: pointer;
  font-family: inherit;
  font-size: 12px;
  font-weight: 700;
  color: var(--color-text-primary);
  transition: transform 0.12s ease, background 0.15s ease;
}
.demo-account:active { transform: scale(0.94); }
.demo-account:disabled { opacity: 0.6; cursor: wait; }

.demo-account-icon {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--acc) 12%, white);
  color: var(--acc);
  display: flex;
  align-items: center;
  justify-content: center;
}

.demo-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid color-mix(in srgb, var(--acc) 30%, transparent);
  border-top-color: var(--acc);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
</style>
