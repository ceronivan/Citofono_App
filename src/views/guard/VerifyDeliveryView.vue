<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useDeliveriesStore } from '@/stores/deliveries.store'
import type { Delivery } from '@/types'
import dayjs from 'dayjs'

const store = useDeliveriesStore()

onMounted(() => store.fetchExpected())

const digits = ref('')
const result = ref<'idle' | 'match' | 'no-match'>('idle')
const matched = ref<Delivery | null>(null)
const confirming = ref(false)
const justDelivered = ref(false)

function press(d: string) {
  if (digits.value.length >= 6 || result.value === 'match') return
  digits.value += d
  result.value = 'idle'
  // Auto-verificar al alcanzar 4 dígitos si hay coincidencia exacta
  if (digits.value.length >= 4) verify(false)
}

function backspace() {
  digits.value = digits.value.slice(0, -1)
  result.value = 'idle'
  matched.value = null
}

function clearAll() {
  digits.value = ''
  result.value = 'idle'
  matched.value = null
  justDelivered.value = false
}

function verify(showError = true) {
  const found = store.expected.find((d) => d.code === digits.value)
  if (found) {
    matched.value = found
    result.value = 'match'
    if (navigator.vibrate) navigator.vibrate(80)
  } else if (showError) {
    result.value = 'no-match'
    if (navigator.vibrate) navigator.vibrate([60, 40, 60])
  }
}

async function confirmDelivery() {
  if (!matched.value) return
  confirming.value = true
  try {
    await store.markDelivered(matched.value.id)
    justDelivered.value = true
    setTimeout(clearAll, 2600)
  } finally {
    confirming.value = false
  }
}

const expectedToday = computed(() => store.expected)

function fmtTime(ts: { toDate?: () => Date } | undefined) {
  const d = ts?.toDate?.()
  return d ? dayjs(d).format('h:mm a') : ''
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9']
</script>

<template>
  <div>
    <ScreenHeader title="Verificar domicilio" />
    <VContainer class="py-4">
      <!-- Pantalla de éxito -->
      <Transition name="zoom">
        <div v-if="justDelivered" class="vd-success">
          <div class="vd-success-ring">
            <VIcon icon="mdi-check-bold" size="40" color="white" />
          </div>
          <h2>¡Entrega autorizada!</h2>
          <p>Apto {{ matched?.apartmentNumber }}<template v-if="matched?.tower"> · {{ matched?.tower }}</template> fue notificado</p>
        </div>
      </Transition>

      <template v-if="!justDelivered">
        <!-- Display del código -->
        <div
          class="vd-display"
          :class="{ 'vd-display--match': result === 'match', 'vd-display--error': result === 'no-match' }"
        >
          <div class="vd-dots">
            <span
              v-for="i in Math.max(4, digits.length)"
              :key="i"
              class="vd-digit"
              :class="{ 'vd-digit--filled': i <= digits.length }"
            >{{ digits[i - 1] ?? '' }}</span>
          </div>
          <p class="vd-hint">
            <template v-if="result === 'no-match'">
              <VIcon icon="mdi-alert-circle" size="14" /> Código no encontrado — pide al repartidor confirmarlo
            </template>
            <template v-else-if="result === 'match'">
              <VIcon icon="mdi-check-circle" size="14" /> ¡Código válido!
            </template>
            <template v-else>Ingresa el código que entrega el repartidor</template>
          </p>
        </div>

        <!-- Tarjeta de coincidencia -->
        <Transition name="rise">
          <div v-if="result === 'match' && matched" class="vd-match">
            <div class="vd-match-icon">
              <VIcon icon="mdi-moped" size="24" />
            </div>
            <div class="vd-match-info">
              <strong>{{ matched.vendor }}</strong>
              <span v-if="matched.description">{{ matched.description }}</span>
              <span class="vd-match-apt">
                <VIcon icon="mdi-door" size="13" />
                Apto {{ matched.apartmentNumber }}<template v-if="matched.tower"> · {{ matched.tower }}</template>
              </span>
            </div>
            <VBtn
              color="success"
              rounded="pill"
              class="text-none"
              :loading="confirming"
              @click="confirmDelivery"
            >Autorizar</VBtn>
          </div>
        </Transition>

        <!-- Teclado -->
        <div v-if="result !== 'match'" class="vd-pad">
          <button v-for="k in KEYS" :key="k" class="vd-key" @click="press(k)">{{ k }}</button>
          <button class="vd-key vd-key--ghost" @click="clearAll">C</button>
          <button class="vd-key" @click="press('0')">0</button>
          <button class="vd-key vd-key--ghost" @click="backspace">
            <VIcon icon="mdi-backspace-outline" size="22" />
          </button>
        </div>

        <!-- Esperados hoy -->
        <section class="vd-expected">
          <h3 class="vd-expected-title">
            Domicilios esperados
            <VChip size="x-small" color="warning" variant="tonal">{{ expectedToday.length }}</VChip>
          </h3>
          <LoadingSpinner v-if="store.loading" />
          <EmptyState v-else-if="!expectedToday.length" icon="mdi-moped-outline" message="Nadie espera domicilios ahora" />
          <div v-else class="vd-expected-list">
            <div v-for="d in expectedToday" :key="d.id" class="vd-exp-item">
              <span class="vd-exp-apt">{{ d.apartmentNumber }}</span>
              <div class="vd-exp-info">
                <span class="vd-exp-vendor">{{ d.vendor }}</span>
                <span class="vd-exp-time">{{ fmtTime(d.createdAt) }}</span>
              </div>
              <VIcon icon="mdi-lock-outline" size="15" class="vd-exp-lock" />
            </div>
          </div>
        </section>
      </template>
    </VContainer>
  </div>
</template>

<style scoped>
/* Display */
.vd-display {
  background: var(--color-surface);
  border-radius: 20px;
  padding: 22px 16px 14px;
  text-align: center;
  box-shadow: var(--shadow-xs);
  border: 2px solid transparent;
  transition: border-color 0.2s ease, background 0.2s ease;
  margin-bottom: 14px;
}
.vd-display--match { border-color: var(--color-success); background: #F6FEF9; }
.vd-display--error { border-color: var(--color-error); animation: shake 0.35s ease; }

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-7px); }
  75% { transform: translateX(7px); }
}

.vd-dots { display: flex; justify-content: center; gap: 10px; margin-bottom: 10px; }

.vd-digit {
  width: 44px; height: 54px;
  border-radius: 12px;
  background: var(--color-surface-2);
  display: flex; align-items: center; justify-content: center;
  font-size: 26px; font-weight: 800;
  color: var(--color-text-primary);
  font-variant-numeric: tabular-nums;
  transition: all 0.15s ease;
}
.vd-digit--filled {
  background: var(--color-primary-soft);
  color: var(--color-primary);
  transform: scale(1.04);
}
.vd-display--match .vd-digit--filled { background: var(--color-success-soft); color: var(--color-success); }

.vd-hint {
  font-size: 12px; color: var(--color-text-secondary);
  margin: 0; display: flex; align-items: center; justify-content: center; gap: 4px;
}
.vd-display--error .vd-hint { color: var(--color-error); font-weight: 600; }
.vd-display--match .vd-hint { color: var(--color-success); font-weight: 600; }

/* Match card */
.vd-match {
  display: flex; align-items: center; gap: 12px;
  background: var(--color-surface);
  border: 1.5px solid var(--color-success);
  border-radius: 18px;
  padding: 14px 16px;
  margin-bottom: 16px;
  box-shadow: 0 6px 20px rgba(34, 197, 94, 0.15);
}
.vd-match-icon {
  width: 46px; height: 46px; border-radius: 14px;
  background: var(--color-success-soft); color: var(--color-success);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.vd-match-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
.vd-match-info strong { font-size: 14.5px; color: var(--color-text-primary); }
.vd-match-info span { font-size: 12px; color: var(--color-text-secondary); }
.vd-match-apt { display: inline-flex; align-items: center; gap: 3px; font-weight: 600; }

/* Pad */
.vd-pad {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;
  max-width: 280px; margin: 0 auto 24px;
}
.vd-key {
  height: 58px; border: none; border-radius: 16px;
  background: var(--color-surface);
  font-size: 22px; font-weight: 700;
  color: var(--color-text-primary);
  cursor: pointer; box-shadow: var(--shadow-xs);
  transition: transform 0.1s ease, background 0.1s ease;
  font-family: inherit;
  display: flex; align-items: center; justify-content: center;
}
.vd-key:active { transform: scale(0.92); background: var(--color-primary-soft); }
.vd-key--ghost { background: transparent; box-shadow: none; color: var(--color-text-secondary); }

/* Success */
.vd-success {
  display: flex; flex-direction: column; align-items: center;
  padding: 60px 20px; text-align: center;
}
.vd-success-ring {
  width: 88px; height: 88px; border-radius: 50%;
  background: linear-gradient(135deg, #22C55E, #16A34A);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 20px;
  animation: pop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 12px 32px rgba(34, 197, 94, 0.35);
}
@keyframes pop { 0% { transform: scale(0); } 100% { transform: scale(1); } }
.vd-success h2 { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; margin: 0 0 4px; }
.vd-success p { font-size: 14px; color: var(--color-text-secondary); margin: 0; }

.zoom-enter-active { transition: all 0.3s ease; }
.zoom-enter-from { opacity: 0; transform: scale(0.9); }

.rise-enter-active { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.rise-enter-from { opacity: 0; transform: translateY(14px) scale(0.97); }

/* Expected list */
.vd-expected-title {
  display: flex; align-items: center; gap: 8px;
  font-size: 13px; font-weight: 700; color: var(--color-text-secondary);
  text-transform: uppercase; letter-spacing: 0.5px;
  margin: 0 0 10px;
}
.vd-expected-list { display: flex; flex-direction: column; gap: 6px; }
.vd-exp-item {
  display: flex; align-items: center; gap: 12px;
  background: var(--color-surface);
  border-radius: 13px; padding: 10px 14px;
  box-shadow: var(--shadow-xs);
}
.vd-exp-apt {
  min-width: 44px; text-align: center;
  font-size: 14px; font-weight: 800;
  color: var(--color-guard);
  background: rgba(16, 185, 129, 0.1);
  border-radius: 9px; padding: 5px 8px;
}
.vd-exp-info { flex: 1; display: flex; flex-direction: column; }
.vd-exp-vendor { font-size: 13px; font-weight: 600; color: var(--color-text-primary); }
.vd-exp-time { font-size: 11px; color: var(--color-text-tertiary); }
.vd-exp-lock { color: var(--color-text-disabled); }
</style>
