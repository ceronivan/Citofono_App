<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useComplexStore, type TowerConfig } from '@/stores/complex.store'
import type { Amenity } from '@/types'

const router = useRouter()
const complexStore = useComplexStore()

const step = ref(1)
const direction = ref<'fwd' | 'back'>('fwd')
const saving = ref(false)
const error = ref('')

// Resultado
const createdInviteCode = ref('')
const copied = ref(false)

// ── Paso 1: Información básica ────────────────────────────────────────────────
const name = ref('')
const address = ref('')
const city = ref('')
const phone = ref('')

// ── Paso 2: Torres ────────────────────────────────────────────────────────────
const towersConfig = ref<TowerConfig[]>([{ name: 'Torre A', floors: 10, unitsPerFloor: 4 }])

const totalUnits = computed(() =>
  towersConfig.value.reduce((sum, t) => sum + (t.floors || 0) * (t.unitsPerFloor || 0), 0),
)

const TOWER_LETTERS = 'ABCDEFGHIJ'
function addTower() {
  const idx = towersConfig.value.length
  towersConfig.value.push({
    name: `Torre ${TOWER_LETTERS[idx] ?? idx + 1}`,
    floors: 10,
    unitsPerFloor: 4,
  })
}
function removeTower(i: number) {
  towersConfig.value.splice(i, 1)
}

// ── Paso 3: Amenidades ────────────────────────────────────────────────────────
interface AmenityOption extends Amenity {
  selected: boolean
}

const amenityOptions = ref<AmenityOption[]>([
  { id: 'social_room', name: 'Salón Social', icon: 'mdi-party-popper', requiresApproval: true, blockIfDelinquent: true, active: true, selected: true },
  { id: 'pool', name: 'Piscina', icon: 'mdi-pool', requiresApproval: true, blockIfDelinquent: true, active: true, selected: true },
  { id: 'bbq', name: 'Zona BBQ', icon: 'mdi-grill-outline', requiresApproval: true, blockIfDelinquent: true, active: true, selected: false },
  { id: 'gym', name: 'Gimnasio', icon: 'mdi-dumbbell', requiresApproval: false, blockIfDelinquent: true, active: true, selected: false },
  { id: 'court', name: 'Cancha', icon: 'mdi-basketball', requiresApproval: true, blockIfDelinquent: true, active: true, selected: false },
  { id: 'coworking', name: 'Coworking', icon: 'mdi-laptop', requiresApproval: false, blockIfDelinquent: true, active: true, selected: false },
  { id: 'kids', name: 'Zona Infantil', icon: 'mdi-teddy-bear', requiresApproval: false, blockIfDelinquent: false, active: true, selected: false },
  { id: 'terrace', name: 'Terraza', icon: 'mdi-weather-sunny', requiresApproval: true, blockIfDelinquent: true, active: true, selected: false },
])

const customAmenityName = ref('')
function addCustomAmenity() {
  const n = customAmenityName.value.trim()
  if (!n) return
  amenityOptions.value.push({
    id: `custom_${Date.now()}`,
    name: n,
    icon: 'mdi-star-outline',
    requiresApproval: true,
    blockIfDelinquent: true,
    active: true,
    selected: true,
  })
  customAmenityName.value = ''
}

const selectedAmenities = computed(() => amenityOptions.value.filter((a) => a.selected))

// ── Navegación ────────────────────────────────────────────────────────────────
const canNext = computed(() => {
  if (step.value === 1) return name.value.trim().length >= 3 && address.value.trim().length >= 3 && city.value.trim().length >= 2
  if (step.value === 2) return towersConfig.value.length > 0 && towersConfig.value.every((t) => t.name.trim() && t.floors > 0 && t.unitsPerFloor > 0) && totalUnits.value <= 2000
  if (step.value === 3) return selectedAmenities.value.length > 0
  return true
})

function next() {
  direction.value = 'fwd'
  step.value++
}
function back() {
  direction.value = 'back'
  if (step.value === 1) router.back()
  else step.value--
}

async function create() {
  saving.value = true
  error.value = ''
  try {
    const result = await complexStore.createBuilding({
      name: name.value.trim(),
      address: address.value.trim(),
      city: city.value.trim(),
      phone: phone.value.trim(),
      towersConfig: towersConfig.value,
      amenities: selectedAmenities.value.map(({ selected: _s, ...a }) => a),
    })
    createdInviteCode.value = result.inviteCode
    direction.value = 'fwd'
    step.value = 5 // pantalla de éxito
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Error creando el edificio'
  } finally {
    saving.value = false
  }
}

async function copyCode() {
  await navigator.clipboard.writeText(createdInviteCode.value)
  copied.value = true
  setTimeout(() => (copied.value = false), 2000)
}

function finish() {
  window.location.assign('/admin')
}
</script>

<template>
  <div class="wizard">
    <!-- Header con progreso -->
    <header class="wiz-header" v-if="step <= 4">
      <button class="wiz-back" @click="back" aria-label="Atrás">
        <VIcon icon="mdi-arrow-left" size="22" />
      </button>
      <div class="wiz-progress">
        <div v-for="i in 4" :key="i" class="wiz-dot" :class="{ 'wiz-dot--done': step >= i }" />
      </div>
      <div style="width: 40px" />
    </header>

    <Transition :name="direction === 'fwd' ? 'slide-fwd' : 'slide-back'" mode="out-in">
      <!-- ── Paso 1 ── -->
      <section v-if="step === 1" key="s1" class="wiz-step">
        <div class="wiz-emoji">🏢</div>
        <h1 class="wiz-title">Tu edificio</h1>
        <p class="wiz-sub">Información básica del conjunto residencial</p>

        <div class="wiz-form">
          <VTextField v-model="name" label="Nombre del conjunto" placeholder="Conjunto El Prado" variant="outlined" density="comfortable" hide-details="auto" />
          <VTextField v-model="address" label="Dirección" placeholder="Calle 123 # 45-67" variant="outlined" density="comfortable" hide-details="auto" />
          <VTextField v-model="city" label="Ciudad" placeholder="Bogotá" variant="outlined" density="comfortable" hide-details="auto" />
          <VTextField v-model="phone" label="Teléfono (opcional)" placeholder="601 234 5678" variant="outlined" density="comfortable" hide-details="auto" />
        </div>
      </section>

      <!-- ── Paso 2: Torres ── -->
      <section v-else-if="step === 2" key="s2" class="wiz-step">
        <div class="wiz-emoji">🗼</div>
        <h1 class="wiz-title">Torres y apartamentos</h1>
        <p class="wiz-sub">Define las torres y cuántos aptos tiene cada una. Los números se generan como piso + apto (ej: 501).</p>

        <TransitionGroup name="tower-list" tag="div" class="tower-list">
          <div v-for="(t, i) in towersConfig" :key="i" class="tower-card">
            <div class="tower-card-head">
              <VTextField v-model="t.name" variant="plain" density="compact" hide-details class="tower-name-input" />
              <button v-if="towersConfig.length > 1" class="tower-remove" @click="removeTower(i)">
                <VIcon icon="mdi-close" size="16" />
              </button>
            </div>
            <div class="tower-fields">
              <div class="tower-field">
                <label>Pisos</label>
                <VTextField v-model.number="t.floors" type="number" min="1" max="60" variant="outlined" density="compact" hide-details />
              </div>
              <div class="tower-field">
                <label>Aptos por piso</label>
                <VTextField v-model.number="t.unitsPerFloor" type="number" min="1" max="20" variant="outlined" density="compact" hide-details />
              </div>
              <div class="tower-count">
                {{ (t.floors || 0) * (t.unitsPerFloor || 0) }} aptos
              </div>
            </div>
          </div>
        </TransitionGroup>

        <button class="wiz-add-btn" @click="addTower">
          <VIcon icon="mdi-plus" size="18" /> Agregar torre
        </button>

        <div class="wiz-total" :key="totalUnits">
          <VIcon icon="mdi-door" size="16" />
          <strong>{{ totalUnits }}</strong>&nbsp;apartamentos en total
        </div>
      </section>

      <!-- ── Paso 3: Amenidades ── -->
      <section v-else-if="step === 3" key="s3" class="wiz-step">
        <div class="wiz-emoji">🏊</div>
        <h1 class="wiz-title">Amenidades</h1>
        <p class="wiz-sub">Selecciona las zonas comunes. Toca una seleccionada para configurarla.</p>

        <div class="amenity-grid">
          <div
            v-for="a in amenityOptions"
            :key="a.id"
            class="amenity-chip"
            :class="{ 'amenity-chip--on': a.selected }"
            @click="a.selected = !a.selected"
          >
            <VIcon :icon="a.icon" size="20" />
            <span>{{ a.name }}</span>
            <Transition name="pop">
              <VIcon v-if="a.selected" icon="mdi-check-circle" size="16" class="amenity-check" />
            </Transition>
          </div>
        </div>

        <div class="custom-amenity">
          <VTextField
            v-model="customAmenityName"
            label="Otra amenidad…"
            variant="outlined"
            density="compact"
            hide-details
            @keyup.enter="addCustomAmenity"
          />
          <VBtn icon="mdi-plus" size="small" color="primary" variant="tonal" @click="addCustomAmenity" />
        </div>

        <!-- Config por amenidad seleccionada -->
        <TransitionGroup v-if="selectedAmenities.length" name="tower-list" tag="div" class="amenity-config-list">
          <div v-for="a in selectedAmenities" :key="a.id" class="amenity-config">
            <div class="amenity-config-name">
              <VIcon :icon="a.icon" size="16" /> {{ a.name }}
            </div>
            <label class="amenity-toggle">
              <input v-model="a.requiresApproval" type="checkbox" />
              <span>Requiere aprobación del admin</span>
            </label>
            <label class="amenity-toggle">
              <input v-model="a.blockIfDelinquent" type="checkbox" />
              <span>Bloquear si está en mora</span>
            </label>
          </div>
        </TransitionGroup>
      </section>

      <!-- ── Paso 4: Resumen ── -->
      <section v-else-if="step === 4" key="s4" class="wiz-step">
        <div class="wiz-emoji">✨</div>
        <h1 class="wiz-title">Todo listo</h1>
        <p class="wiz-sub">Revisa antes de crear tu edificio</p>

        <div class="summary-card">
          <div class="summary-row"><span class="summary-key">Nombre</span><span class="summary-val">{{ name }}</span></div>
          <div class="summary-row"><span class="summary-key">Dirección</span><span class="summary-val">{{ address }}, {{ city }}</span></div>
          <div class="summary-row"><span class="summary-key">Torres</span><span class="summary-val">{{ towersConfig.map(t => t.name).join(', ') }}</span></div>
          <div class="summary-row"><span class="summary-key">Apartamentos</span><span class="summary-val">{{ totalUnits }}</span></div>
          <div class="summary-row"><span class="summary-key">Amenidades</span><span class="summary-val">{{ selectedAmenities.map(a => a.name).join(', ') }}</span></div>
        </div>

        <VAlert v-if="error" type="error" variant="tonal" density="compact" class="mt-4">{{ error }}</VAlert>
      </section>

      <!-- ── Éxito ── -->
      <section v-else key="s5" class="wiz-step wiz-step--center">
        <div class="success-burst">
          <div class="success-ring" />
          <VIcon icon="mdi-check" size="42" color="white" class="success-check" />
        </div>
        <h1 class="wiz-title" style="text-align:center">¡Edificio creado!</h1>
        <p class="wiz-sub" style="text-align:center">
          Comparte este código con los propietarios para que se registren y llenen su información
        </p>

        <button class="invite-code-box" @click="copyCode">
          <span class="invite-code">{{ createdInviteCode }}</span>
          <span class="invite-copy">
            <VIcon :icon="copied ? 'mdi-check' : 'mdi-content-copy'" size="15" />
            {{ copied ? '¡Copiado!' : 'Copiar' }}
          </span>
        </button>

        <BtnPrimary class="mt-6" @click="finish">Ir a mi edificio</BtnPrimary>
      </section>
    </Transition>

    <!-- Footer -->
    <footer v-if="step <= 4" class="wiz-footer">
      <BtnPrimary v-if="step < 4" :disabled="!canNext" @click="next">Continuar</BtnPrimary>
      <BtnPrimary v-else :loading="saving" @click="create">
        {{ saving ? 'Creando…' : `Crear edificio (${totalUnits} aptos)` }}
      </BtnPrimary>
    </footer>
  </div>
</template>

<style scoped>
.wizard {
  min-height: 100dvh;
  background: var(--color-bg);
  display: flex;
  flex-direction: column;
  max-width: 480px;
  margin: 0 auto;
}

.wiz-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: max(12px, env(safe-area-inset-top)) 16px 8px;
}

.wiz-back {
  width: 40px; height: 40px;
  display: flex; align-items: center; justify-content: center;
  border: none; background: var(--color-surface); border-radius: 50%;
  cursor: pointer; color: var(--color-text-primary);
  box-shadow: var(--shadow-xs);
  transition: transform 0.12s ease;
}
.wiz-back:active { transform: scale(0.92); }

.wiz-progress { display: flex; gap: 6px; }
.wiz-dot {
  width: 24px; height: 4px; border-radius: 2px;
  background: var(--color-border);
  transition: background 0.3s ease;
}
.wiz-dot--done { background: var(--color-primary); }

.wiz-step { flex: 1; padding: 12px 24px 120px; }
.wiz-step--center {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; padding-top: 60px;
}

.wiz-emoji { font-size: 40px; margin-bottom: 8px; }

.wiz-title {
  font-size: 26px; font-weight: 800; letter-spacing: -0.6px;
  color: var(--color-text-primary); margin: 0 0 4px;
}
.wiz-sub { font-size: 14px; color: var(--color-text-secondary); margin: 0 0 24px; line-height: 1.45; }

.wiz-form { display: flex; flex-direction: column; gap: 14px; }

/* Torres */
.tower-list { display: flex; flex-direction: column; gap: 12px; }
.tower-card {
  background: var(--color-surface); border-radius: 16px; padding: 12px 16px;
  box-shadow: var(--shadow-xs);
}
.tower-card-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
.tower-name-input :deep(input) { font-weight: 700; font-size: 15px; }
.tower-remove {
  width: 28px; height: 28px; border: none; border-radius: 50%;
  background: var(--color-error-soft); color: var(--color-error);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.tower-fields { display: flex; gap: 10px; align-items: flex-end; }
.tower-field { flex: 1; }
.tower-field label { font-size: 11px; font-weight: 600; color: var(--color-text-secondary); display: block; margin-bottom: 4px; }
.tower-count {
  font-size: 12px; font-weight: 700; color: var(--color-primary);
  background: var(--color-primary-soft); border-radius: 9999px;
  padding: 6px 10px; white-space: nowrap; margin-bottom: 4px;
}

.wiz-add-btn {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  width: 100%; margin-top: 12px; padding: 12px;
  border: 1.5px dashed var(--color-border); border-radius: 14px;
  background: transparent; color: var(--color-primary);
  font-size: 14px; font-weight: 600; cursor: pointer;
  transition: background 0.15s ease;
}
.wiz-add-btn:active { background: var(--color-primary-10); }

.wiz-total {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  margin-top: 16px; font-size: 14px; color: var(--color-text-secondary);
  animation: pulse-in 0.3s ease;
}
.wiz-total strong { color: var(--color-text-primary); font-size: 16px; }

@keyframes pulse-in {
  0% { transform: scale(0.9); opacity: 0.5; }
  60% { transform: scale(1.05); }
  100% { transform: scale(1); opacity: 1; }
}

/* Amenidades */
.amenity-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
.amenity-chip {
  position: relative;
  display: flex; align-items: center; gap: 8px;
  padding: 12px 14px; border-radius: 14px;
  background: var(--color-surface); border: 1.5px solid transparent;
  cursor: pointer; font-size: 13px; font-weight: 600;
  color: var(--color-text-secondary);
  box-shadow: var(--shadow-xs);
  transition: all 0.15s ease;
  user-select: none;
}
.amenity-chip:active { transform: scale(0.96); }
.amenity-chip--on {
  border-color: var(--color-primary); color: var(--color-primary);
  background: var(--color-primary-10);
}
.amenity-check { position: absolute; top: 6px; right: 6px; color: var(--color-primary); }

.pop-enter-active { animation: pop-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1); }
@keyframes pop-in { 0% { transform: scale(0); } 100% { transform: scale(1); } }

.custom-amenity { display: flex; gap: 8px; align-items: center; margin-top: 12px; }

.amenity-config-list { display: flex; flex-direction: column; gap: 8px; margin-top: 20px; }
.amenity-config {
  background: var(--color-surface); border-radius: 14px; padding: 12px 16px;
  box-shadow: var(--shadow-xs);
}
.amenity-config-name {
  display: flex; align-items: center; gap: 6px;
  font-size: 13px; font-weight: 700; color: var(--color-text-primary);
  margin-bottom: 8px;
}
.amenity-toggle {
  display: flex; align-items: center; gap: 8px;
  font-size: 12.5px; color: var(--color-text-secondary);
  padding: 4px 0; cursor: pointer;
}
.amenity-toggle input { accent-color: var(--color-primary); width: 16px; height: 16px; }

/* Resumen */
.summary-card {
  background: var(--color-surface); border-radius: 18px; padding: 8px 18px;
  box-shadow: var(--shadow-sm);
}
.summary-row {
  display: flex; justify-content: space-between; gap: 16px;
  padding: 12px 0; border-bottom: 1px solid var(--color-border-light);
}
.summary-row:last-child { border-bottom: none; }
.summary-key { font-size: 13px; color: var(--color-text-secondary); flex-shrink: 0; }
.summary-val { font-size: 13px; font-weight: 600; color: var(--color-text-primary); text-align: right; }

/* Éxito */
.success-burst {
  position: relative; width: 90px; height: 90px;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 24px;
}
.success-ring {
  position: absolute; inset: 0; border-radius: 50%;
  background: linear-gradient(135deg, #22C55E, #16A34A);
  animation: ring-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.success-check { position: relative; animation: check-in 0.4s 0.15s both cubic-bezier(0.34, 1.56, 0.64, 1); }
@keyframes ring-pop { 0% { transform: scale(0); } 100% { transform: scale(1); } }
@keyframes check-in { 0% { transform: scale(0) rotate(-30deg); } 100% { transform: scale(1) rotate(0); } }

.invite-code-box {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  margin-top: 20px; padding: 18px 32px;
  background: var(--color-surface); border: 1.5px dashed var(--color-primary);
  border-radius: 18px; cursor: pointer;
  transition: transform 0.12s ease;
  width: 100%;
}
.invite-code-box:active { transform: scale(0.97); }
.invite-code {
  font-size: 26px; font-weight: 800; letter-spacing: 3px;
  color: var(--color-primary); font-variant-numeric: tabular-nums;
}
.invite-copy {
  display: flex; align-items: center; gap: 5px;
  font-size: 12px; font-weight: 600; color: var(--color-text-secondary);
}

/* Footer */
.wiz-footer {
  position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);
  width: 100%; max-width: 480px;
  padding: 12px 24px max(20px, env(safe-area-inset-bottom));
  background: linear-gradient(transparent, var(--color-bg) 30%);
}

/* Transiciones de paso */
.slide-fwd-enter-active, .slide-fwd-leave-active,
.slide-back-enter-active, .slide-back-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}
.slide-fwd-enter-from { opacity: 0; transform: translateX(40px); }
.slide-fwd-leave-to { opacity: 0; transform: translateX(-40px); }
.slide-back-enter-from { opacity: 0; transform: translateX(-40px); }
.slide-back-leave-to { opacity: 0; transform: translateX(40px); }

.tower-list-enter-active { transition: all 0.25s ease; }
.tower-list-enter-from { opacity: 0; transform: translateY(10px) scale(0.97); }
.tower-list-leave-active { transition: all 0.2s ease; position: absolute; opacity: 0; }
.tower-list-move { transition: transform 0.25s ease; }
</style>
