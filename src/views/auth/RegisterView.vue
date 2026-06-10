<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth.store'
import type { Invite } from '@/types'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

type Mode = 'code' | 'form' | 'admin-form'
const mode = ref<Mode>('code')
const direction = ref<'fwd' | 'back'>('fwd')

// ── Código de invitación ──────────────────────────────────────────────────────
const inviteCode = ref(String(route.query.code ?? ''))
const checkingCode = ref(false)
const codeError = ref('')
const invite = ref<Invite | null>(null)

async function validateCode() {
  const code = inviteCode.value.trim().toUpperCase()
  if (!code) return
  checkingCode.value = true
  codeError.value = ''
  try {
    const snap = await getDoc(doc(db, 'invites', code))
    if (!snap.exists()) {
      codeError.value = 'Código no encontrado. Verifica con tu administrador.'
      return
    }
    const inv = { id: snap.id, ...snap.data() } as Invite
    if (!inv.active) { codeError.value = 'Este código fue desactivado.'; return }
    if (inv.maxUses > 0 && inv.usedCount >= inv.maxUses) { codeError.value = 'Este código ya alcanzó su límite de usos.'; return }
    if (inv.expiresAt && inv.expiresAt.toMillis() < Date.now()) { codeError.value = 'Este código expiró.'; return }
    invite.value = inv
    direction.value = 'fwd'
    mode.value = 'form'
  } catch {
    codeError.value = 'No pudimos validar el código. Revisa tu conexión.'
  } finally {
    checkingCode.value = false
  }
}

// ── Formulario ────────────────────────────────────────────────────────────────
const firstName = ref('')
const lastName = ref('')
const phone = ref('')
const idNumber = ref('')
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const tower = ref('')
const apartmentNumber = ref('')

const saving = ref(false)
const formError = ref('')

const isResidentInvite = computed(() => invite.value?.role === 'resident')
const towers = computed(() => invite.value?.towers ?? [])

const ROLE_LABEL: Record<string, string> = {
  resident: 'Residente', admin: 'Administrador', guard: 'Portería',
}

const canSubmit = computed(() => {
  const base =
    firstName.value.trim() && lastName.value.trim() && phone.value.trim() &&
    idNumber.value.trim() && /\S+@\S+\.\S+/.test(email.value) && password.value.length >= 6
  if (mode.value === 'admin-form') return !!base
  if (isResidentInvite.value) {
    return !!base && !!apartmentNumber.value.trim() && (towers.value.length <= 1 || !!tower.value)
  }
  return !!base
})

const ERRORS: Record<string, string> = {
  'auth/email-already-in-use': 'Este correo ya tiene una cuenta',
  'auth/invalid-email': 'Correo inválido',
  'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
  'auth/network-request-failed': 'Sin conexión a internet',
  INVITE_NOT_FOUND: 'El código de invitación ya no existe',
  INVITE_INACTIVE: 'El código fue desactivado',
  INVITE_EXHAUSTED: 'El código alcanzó su límite de usos',
  INVITE_EXPIRED: 'El código expiró',
}

async function submit() {
  saving.value = true
  formError.value = ''
  try {
    if (mode.value === 'admin-form') {
      await authStore.registerAdmin({
        email: email.value.trim(),
        password: password.value,
        firstName: firstName.value.trim(),
        lastName: lastName.value.trim(),
        phone: phone.value.trim(),
        idNumber: idNumber.value.trim(),
      })
      router.push('/setup/building')
      return
    }

    const selectedTower = towers.value.length === 1 ? towers.value[0] : tower.value
    // ID determinístico de la unidad — coincide con la generación del wizard
    const unitId = isResidentInvite.value && selectedTower && apartmentNumber.value
      ? `${selectedTower.replace(/\s+/g, '-')}_${apartmentNumber.value.trim()}`.toLowerCase()
      : undefined

    const user = await authStore.registerWithInvite({
      email: email.value.trim(),
      password: password.value,
      firstName: firstName.value.trim(),
      lastName: lastName.value.trim(),
      phone: phone.value.trim(),
      idNumber: idNumber.value.trim(),
      inviteCode: invite.value!.id,
      ...(unitId ? { unitId } : {}),
      ...(isResidentInvite.value ? { apartmentNumber: apartmentNumber.value.trim(), tower: selectedTower } : {}),
    })
    const DASHBOARD: Record<string, string> = { resident: '/', admin: '/admin', guard: '/guard' }
    router.push(DASHBOARD[user.memberships?.[0]?.role ?? 'resident'])
  } catch (e: unknown) {
    const code = (e as { code?: string; message?: string })?.code ?? (e as Error)?.message
    formError.value = ERRORS[code ?? ''] ?? 'Error al crear la cuenta'
  } finally {
    saving.value = false
  }
}

function goBack() {
  direction.value = 'back'
  if (mode.value === 'code') router.push('/login')
  else mode.value = 'code'
}
</script>

<template>
  <div class="reg-shell">
    <div class="reg-bg-blob" aria-hidden="true" />

    <header class="reg-header">
      <button class="reg-back" @click="goBack" aria-label="Atrás">
        <VIcon icon="mdi-arrow-left" size="22" />
      </button>
    </header>

    <Transition :name="direction === 'fwd' ? 'slide-fwd' : 'slide-back'" mode="out-in">
      <!-- ── Paso: código ── -->
      <div v-if="mode === 'code'" key="code" class="reg-content">
        <div class="reg-icon-badge">
          <VIcon icon="mdi-ticket-confirmation-outline" size="30" color="white" />
        </div>
        <h1 class="reg-title">Únete a tu edificio</h1>
        <p class="reg-sub">Ingresa el código de invitación que te compartió tu administrador</p>

        <div class="code-input-wrap" :class="{ 'code-input-wrap--error': codeError }">
          <input
            v-model="inviteCode"
            class="code-input"
            placeholder="PRADO-7X2K"
            autocapitalize="characters"
            spellcheck="false"
            @input="codeError = ''"
            @keyup.enter="validateCode"
          />
        </div>

        <Transition name="shake-in">
          <p v-if="codeError" class="code-error">
            <VIcon icon="mdi-alert-circle-outline" size="14" /> {{ codeError }}
          </p>
        </Transition>

        <button
          class="reg-submit"
          :disabled="!inviteCode.trim() || checkingCode"
          @click="validateCode"
        >
          <span v-if="!checkingCode">Validar código</span>
          <span v-else class="reg-spinner" />
        </button>

        <div class="reg-divider"><span>o</span></div>

        <button class="reg-admin-cta" @click="direction = 'fwd'; mode = 'admin-form'">
          <VIcon icon="mdi-shield-crown-outline" size="18" />
          Soy administrador — crear mi edificio
        </button>
      </div>

      <!-- ── Paso: formulario ── -->
      <div v-else key="form" class="reg-content">
        <template v-if="mode === 'form'">
          <div class="invite-banner">
            <VIcon icon="mdi-office-building" size="18" />
            <div>
              <strong>{{ invite?.complexName }}</strong>
              <span>Te unirás como {{ ROLE_LABEL[invite?.role ?? 'resident'] }}</span>
            </div>
          </div>
        </template>
        <template v-else>
          <h1 class="reg-title">Crea tu cuenta</h1>
          <p class="reg-sub">Después configurarás tu primer edificio</p>
        </template>

        <div class="reg-form">
          <div class="reg-row">
            <VTextField v-model="firstName" label="Nombre" variant="outlined" density="comfortable" hide-details="auto" />
            <VTextField v-model="lastName" label="Apellido" variant="outlined" density="comfortable" hide-details="auto" />
          </div>
          <VTextField v-model="idNumber" label="Cédula" type="tel" variant="outlined" density="comfortable" hide-details="auto" />
          <VTextField v-model="phone" label="Celular" type="tel" variant="outlined" density="comfortable" hide-details="auto" />

          <template v-if="mode === 'form' && isResidentInvite">
            <div class="reg-row">
              <VSelect
                v-if="towers.length > 1"
                v-model="tower"
                :items="towers"
                label="Torre"
                variant="outlined"
                density="comfortable"
                hide-details="auto"
              />
              <VTextField v-model="apartmentNumber" label="Apto" placeholder="501" variant="outlined" density="comfortable" hide-details="auto" />
            </div>
          </template>

          <VTextField v-model="email" label="Correo electrónico" type="email" variant="outlined" density="comfortable" hide-details="auto" autocomplete="email" />
          <VTextField
            v-model="password"
            label="Contraseña"
            :type="showPassword ? 'text' : 'password'"
            :append-inner-icon="showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
            variant="outlined"
            density="comfortable"
            hide-details="auto"
            hint="Mínimo 6 caracteres"
            autocomplete="new-password"
            @click:append-inner="showPassword = !showPassword"
          />

          <VAlert v-if="formError" type="error" variant="tonal" density="compact">{{ formError }}</VAlert>

          <button class="reg-submit" :disabled="!canSubmit || saving" @click="submit">
            <span v-if="!saving">Crear cuenta</span>
            <span v-else class="reg-spinner" />
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.reg-shell {
  min-height: 100dvh;
  background: var(--color-bg);
  position: relative;
  overflow-x: hidden;
  max-width: 480px;
  margin: 0 auto;
}

.reg-bg-blob {
  position: absolute; top: -120px; left: 50%; transform: translateX(-50%);
  width: 500px; height: 500px; border-radius: 50%;
  background: radial-gradient(ellipse at center, rgba(79,53,232,0.10) 0%, transparent 70%);
  pointer-events: none;
}

.reg-header { padding: max(12px, env(safe-area-inset-top)) 16px 0; position: relative; z-index: 1; }

.reg-back {
  width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;
  border: none; background: var(--color-surface); border-radius: 50%;
  cursor: pointer; color: var(--color-text-primary); box-shadow: var(--shadow-xs);
  transition: transform 0.12s ease;
}
.reg-back:active { transform: scale(0.92); }

.reg-content { padding: 16px 24px 48px; position: relative; z-index: 1; }

.reg-icon-badge {
  width: 60px; height: 60px;
  background: linear-gradient(135deg, #4F35E8, #7B64F0);
  border-radius: 18px;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 16px;
  box-shadow: 0 8px 24px rgba(79,53,232,0.3);
}

.reg-title { font-size: 26px; font-weight: 800; letter-spacing: -0.6px; margin: 0 0 6px; color: var(--color-text-primary); }
.reg-sub { font-size: 14px; color: var(--color-text-secondary); margin: 0 0 28px; line-height: 1.45; }

/* Código */
.code-input-wrap {
  background: var(--color-surface);
  border: 2px solid var(--color-border);
  border-radius: 18px;
  transition: border-color 0.15s ease;
}
.code-input-wrap:focus-within { border-color: var(--color-primary); }
.code-input-wrap--error { border-color: var(--color-error); animation: shake 0.35s ease; }

.code-input {
  width: 100%; border: none; background: transparent; outline: none;
  text-align: center; font-size: 24px; font-weight: 800; letter-spacing: 4px;
  padding: 18px 16px; color: var(--color-text-primary);
  text-transform: uppercase; font-family: inherit;
}
.code-input::placeholder { color: var(--color-text-disabled); letter-spacing: 3px; }

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-6px); }
  75% { transform: translateX(6px); }
}

.code-error {
  display: flex; align-items: center; gap: 5px;
  color: var(--color-error); font-size: 13px; font-weight: 500;
  margin: 10px 4px 0;
}
.shake-in-enter-active { animation: shake 0.35s ease; }

/* Banner de invitación */
.invite-banner {
  display: flex; align-items: center; gap: 12px;
  background: var(--color-primary-soft); color: var(--color-primary);
  border-radius: 16px; padding: 14px 16px; margin-bottom: 24px;
  animation: pulse-in 0.35s ease;
}
.invite-banner div { display: flex; flex-direction: column; }
.invite-banner strong { font-size: 14px; font-weight: 700; }
.invite-banner span { font-size: 12px; opacity: 0.8; }

@keyframes pulse-in {
  0% { transform: scale(0.95); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

/* Form */
.reg-form { display: flex; flex-direction: column; gap: 14px; }
.reg-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

.reg-submit {
  width: 100%; height: 52px; border: none; border-radius: 9999px;
  background: var(--color-primary); color: white;
  font-size: 15px; font-weight: 700; font-family: inherit; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  margin-top: 16px;
  transition: opacity 0.15s ease, transform 0.12s ease;
}
.reg-submit:active { transform: scale(0.98); }
.reg-submit:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

.reg-spinner {
  width: 20px; height: 20px;
  border: 2.5px solid rgba(255,255,255,0.35); border-top-color: white;
  border-radius: 50%; animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.reg-divider {
  display: flex; align-items: center; gap: 12px;
  margin: 20px 0; color: var(--color-text-tertiary); font-size: 12px;
}
.reg-divider::before, .reg-divider::after {
  content: ''; flex: 1; height: 1px; background: var(--color-border);
}

.reg-admin-cta {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  width: 100%; padding: 14px;
  border: 1.5px solid var(--color-border); border-radius: 9999px;
  background: var(--color-surface); cursor: pointer;
  font-size: 14px; font-weight: 600; color: var(--color-text-primary);
  font-family: inherit;
  transition: transform 0.12s ease, border-color 0.15s ease;
}
.reg-admin-cta:active { transform: scale(0.98); border-color: var(--color-primary); }

/* Transiciones */
.slide-fwd-enter-active, .slide-fwd-leave-active,
.slide-back-enter-active, .slide-back-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}
.slide-fwd-enter-from { opacity: 0; transform: translateX(40px); }
.slide-fwd-leave-to { opacity: 0; transform: translateX(-40px); }
.slide-back-enter-from { opacity: 0; transform: translateX(-40px); }
.slide-back-leave-to { opacity: 0; transform: translateX(40px); }
</style>
