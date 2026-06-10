<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useComplexStore } from '@/stores/complex.store'
import type { Unit } from '@/types'

const complexStore = useComplexStore()

const search = ref('')
const towerFilter = ref<string | null>(null)
const statusFilter = ref<'all' | 'delinquent' | 'current'>('all')

onMounted(async () => {
  await Promise.allSettled([complexStore.fetchCurrent(), complexStore.fetchUnits(true)])
})

const filtered = computed(() => {
  let list = complexStore.units
  if (towerFilter.value) list = list.filter((u) => u.tower === towerFilter.value)
  if (statusFilter.value !== 'all') list = list.filter((u) => u.feeStatus === statusFilter.value)
  const q = search.value.trim().toLowerCase()
  if (q) {
    list = list.filter(
      (u) =>
        u.number.includes(q) ||
        u.label.toLowerCase().includes(q) ||
        (u.ownerNames ?? []).some((n) => n.toLowerCase().includes(q)),
    )
  }
  return list
})

const delinquentCount = computed(
  () => complexStore.units.filter((u) => u.feeStatus === 'delinquent').length,
)

// ── Diálogo de cartera ────────────────────────────────────────────────────────
const dialog = ref(false)
const selected = ref<Unit | null>(null)
const feeNotes = ref('')
const saving = ref(false)

const currentPeriod = computed(() => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
})

function openUnit(u: Unit) {
  selected.value = u
  feeNotes.value = u.feeNotes ?? ''
  dialog.value = true
}

async function setStatus(status: 'current' | 'delinquent') {
  if (!selected.value) return
  saving.value = true
  try {
    await complexStore.setUnitFeeStatus(selected.value.id, status, currentPeriod.value, feeNotes.value)
    dialog.value = false
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <ScreenHeader title="Unidades y cartera" />
    <VContainer class="py-4">
      <!-- Resumen -->
      <div class="units-summary">
        <div class="us-card">
          <span class="us-value">{{ complexStore.units.length }}</span>
          <span class="us-label">Apartamentos</span>
        </div>
        <div class="us-card us-card--bad" :class="{ 'us-card--ok': !delinquentCount }">
          <span class="us-value">{{ delinquentCount }}</span>
          <span class="us-label">En mora</span>
        </div>
        <div class="us-card">
          <span class="us-value">{{ complexStore.units.length - delinquentCount }}</span>
          <span class="us-label">Al día</span>
        </div>
      </div>

      <!-- Filtros -->
      <VTextField
        v-model="search"
        placeholder="Buscar apto o propietario…"
        prepend-inner-icon="mdi-magnify"
        variant="solo"
        flat
        rounded="xl"
        density="comfortable"
        hide-details
        class="mb-3"
      />
      <div class="filter-row">
        <VChip
          :variant="statusFilter === 'all' ? 'flat' : 'outlined'"
          color="primary"
          size="small"
          @click="statusFilter = 'all'"
        >Todos</VChip>
        <VChip
          :variant="statusFilter === 'delinquent' ? 'flat' : 'outlined'"
          color="error"
          size="small"
          @click="statusFilter = 'delinquent'"
        >En mora</VChip>
        <VChip
          :variant="statusFilter === 'current' ? 'flat' : 'outlined'"
          color="success"
          size="small"
          @click="statusFilter = 'current'"
        >Al día</VChip>
        <VSpacer />
        <VSelect
          v-if="complexStore.towers.length > 1"
          v-model="towerFilter"
          :items="[{ title: 'Todas', value: null }, ...complexStore.towers.map(t => ({ title: t, value: t }))]"
          density="compact"
          variant="outlined"
          hide-details
          style="max-width: 130px"
        />
      </div>

      <LoadingSpinner v-if="complexStore.loading" />
      <EmptyState v-else-if="!filtered.length" icon="mdi-door" message="No hay unidades que coincidan" />

      <div v-else class="unit-grid">
        <button
          v-for="u in filtered"
          :key="u.id"
          class="unit-cell"
          :class="{ 'unit-cell--delinquent': u.feeStatus === 'delinquent', 'unit-cell--empty': !u.ownerIds.length }"
          @click="openUnit(u)"
        >
          <span class="unit-number">{{ u.label }}</span>
          <span class="unit-owner">{{ u.ownerNames?.[0] ?? 'Sin registrar' }}</span>
          <span class="unit-status-dot" />
        </button>
      </div>
    </VContainer>

    <!-- Diálogo de cartera -->
    <VDialog v-model="dialog" max-width="420">
      <VCard rounded="xl" class="pa-5">
        <div class="d-flex align-center mb-1" style="gap: 10px">
          <VIcon icon="mdi-door" size="22" color="primary" />
          <span class="text-h6 font-weight-bold">{{ selected?.label }}</span>
          <VSpacer />
          <VChip
            size="small"
            variant="tonal"
            :color="selected?.feeStatus === 'delinquent' ? 'error' : 'success'"
          >
            {{ selected?.feeStatus === 'delinquent' ? 'En mora' : 'Al día' }}
          </VChip>
        </div>
        <p class="text-body-2 text-medium-emphasis mb-1">
          {{ selected?.ownerNames?.length ? selected?.ownerNames?.join(', ') : 'Sin propietario registrado' }}
        </p>
        <p v-if="selected?.feePeriod" class="text-caption text-medium-emphasis mb-3">
          Última actualización: {{ selected?.feePeriod }}
        </p>

        <VTextarea v-model="feeNotes" label="Notas (opcional)" rows="2" variant="outlined" density="comfortable" hide-details class="mb-4" />

        <p class="text-caption text-medium-emphasis mb-2">
          Estado de la cuota de administración — periodo {{ currentPeriod }}
        </p>
        <div class="d-flex" style="gap: 10px">
          <VBtn
            color="success"
            variant="tonal"
            rounded="pill"
            class="text-none flex-1-1"
            :loading="saving"
            prepend-icon="mdi-check-circle-outline"
            @click="setStatus('current')"
          >Al día</VBtn>
          <VBtn
            color="error"
            variant="tonal"
            rounded="pill"
            class="text-none flex-1-1"
            :loading="saving"
            prepend-icon="mdi-alert-circle-outline"
            @click="setStatus('delinquent')"
          >En mora</VBtn>
        </div>
        <p class="text-caption text-medium-emphasis mt-3 mb-0">
          <VIcon icon="mdi-information-outline" size="13" />
          Los aptos en mora no podrán reservar amenidades configuradas con bloqueo.
        </p>
      </VCard>
    </VDialog>
  </div>
</template>

<style scoped>
.units-summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px; }

.us-card {
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  background: var(--color-surface); border-radius: 16px; padding: 14px 8px;
  box-shadow: var(--shadow-xs);
}
.us-card--bad .us-value { color: var(--color-error); }
.us-card--ok .us-value { color: var(--color-success); }
.us-value { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; color: var(--color-text-primary); }
.us-label { font-size: 11px; color: var(--color-text-secondary); font-weight: 500; }

.filter-row { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }

.unit-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }

.unit-cell {
  position: relative;
  display: flex; flex-direction: column; align-items: flex-start; gap: 2px;
  background: var(--color-surface);
  border: 1.5px solid transparent;
  border-radius: 14px; padding: 12px;
  cursor: pointer; text-align: left;
  box-shadow: var(--shadow-xs);
  transition: transform 0.12s ease, border-color 0.15s ease;
}
.unit-cell:active { transform: scale(0.95); }
.unit-cell--delinquent { border-color: var(--color-error-soft); background: #FFFBFB; }
.unit-cell--empty { opacity: 0.65; }

.unit-number { font-size: 14px; font-weight: 800; color: var(--color-text-primary); letter-spacing: -0.2px; }
.unit-owner {
  font-size: 10.5px; color: var(--color-text-secondary);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;
}

.unit-status-dot {
  position: absolute; top: 10px; right: 10px;
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--color-success);
}
.unit-cell--delinquent .unit-status-dot { background: var(--color-error); animation: blink 1.6s ease infinite; }

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}

.flex-1-1 { flex: 1 1 0; }
</style>
