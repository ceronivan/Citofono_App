<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useComplexStore } from '@/stores/complex.store'
import type { Amenity } from '@/types'

const complexStore = useComplexStore()

const list = ref<Amenity[]>([])
const saving = ref(false)
const savedFlash = ref(false)

onMounted(async () => {
  await complexStore.fetchCurrent()
  list.value = JSON.parse(JSON.stringify(complexStore.amenities))
})

watch(
  () => complexStore.amenities,
  (v) => { if (!list.value.length) list.value = JSON.parse(JSON.stringify(v)) },
)

const ICON_OPTIONS = [
  'mdi-party-popper', 'mdi-pool', 'mdi-grill-outline', 'mdi-dumbbell',
  'mdi-basketball', 'mdi-laptop', 'mdi-teddy-bear', 'mdi-weather-sunny',
  'mdi-movie-open-outline', 'mdi-paw', 'mdi-bike', 'mdi-star-outline',
]

const newName = ref('')
function addAmenity() {
  const n = newName.value.trim()
  if (!n) return
  list.value.push({
    id: `custom_${Date.now()}`,
    name: n,
    icon: 'mdi-star-outline',
    requiresApproval: true,
    blockIfDelinquent: true,
    active: true,
  })
  newName.value = ''
}

function cycleIcon(a: Amenity) {
  const idx = ICON_OPTIONS.indexOf(a.icon)
  a.icon = ICON_OPTIONS[(idx + 1) % ICON_OPTIONS.length]
}

async function save() {
  saving.value = true
  try {
    await complexStore.saveAmenities(list.value)
    savedFlash.value = true
    setTimeout(() => (savedFlash.value = false), 1800)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <ScreenHeader title="Amenidades" />
    <VContainer class="py-4">
      <p class="text-body-2 text-medium-emphasis mb-4">
        Configura las zonas comunes del edificio. Toca el ícono para cambiarlo.
      </p>

      <TransitionGroup name="am-list" tag="div" class="am-list">
        <div v-for="a in list" :key="a.id" class="am-card" :class="{ 'am-card--off': !a.active }">
          <div class="am-head">
            <button class="am-icon" @click="cycleIcon(a)">
              <VIcon :icon="a.icon" size="20" />
            </button>
            <VTextField v-model="a.name" variant="plain" density="compact" hide-details class="am-name" />
            <VSwitch v-model="a.active" color="primary" hide-details density="compact" />
          </div>
          <div v-if="a.active" class="am-toggles">
            <label class="am-toggle">
              <input v-model="a.requiresApproval" type="checkbox" />
              <span>Requiere aprobación</span>
            </label>
            <label class="am-toggle">
              <input v-model="a.blockIfDelinquent" type="checkbox" />
              <span>Bloquear en mora</span>
            </label>
          </div>
        </div>
      </TransitionGroup>

      <div class="am-add">
        <VTextField
          v-model="newName"
          label="Nueva amenidad…"
          variant="outlined"
          density="compact"
          hide-details
          @keyup.enter="addAmenity"
        />
        <VBtn icon="mdi-plus" size="small" color="primary" variant="tonal" @click="addAmenity" />
      </div>

      <BtnPrimary class="mt-6" :loading="saving" @click="save">
        <VIcon v-if="savedFlash" icon="mdi-check" size="18" class="mr-1" />
        {{ savedFlash ? 'Guardado' : 'Guardar cambios' }}
      </BtnPrimary>
    </VContainer>
  </div>
</template>

<style scoped>
.am-list { display: flex; flex-direction: column; gap: 10px; }

.am-card {
  background: var(--color-surface);
  border-radius: 16px;
  padding: 10px 14px;
  box-shadow: var(--shadow-xs);
  transition: opacity 0.2s ease;
}
.am-card--off { opacity: 0.55; }

.am-head { display: flex; align-items: center; gap: 10px; }

.am-icon {
  width: 38px; height: 38px; border-radius: 11px;
  background: var(--color-primary-soft); color: var(--color-primary);
  border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  transition: transform 0.15s ease;
}
.am-icon:active { transform: scale(0.88) rotate(-8deg); }

.am-name { flex: 1; }
.am-name :deep(input) { font-weight: 700; font-size: 14px; }

.am-toggles { display: flex; gap: 16px; padding: 6px 2px 2px 48px; flex-wrap: wrap; }
.am-toggle {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; color: var(--color-text-secondary); cursor: pointer;
}
.am-toggle input { accent-color: var(--color-primary); width: 15px; height: 15px; }

.am-add { display: flex; gap: 8px; align-items: center; margin-top: 14px; }

.am-list-enter-active { transition: all 0.25s ease; }
.am-list-enter-from { opacity: 0; transform: translateY(8px); }
.am-list-move { transition: transform 0.25s ease; }
</style>
