<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useVisitsStore } from '@/stores/visits.store'
import dayjs from 'dayjs'

const store = useVisitsStore()
onMounted(() => store.fetchAll())

const search = ref('')
const range = ref<'today' | 'week' | 'month' | 'all'>('week')

const RANGES = [
  { value: 'today', label: 'Hoy' },
  { value: 'week', label: '7 días' },
  { value: 'month', label: '30 días' },
  { value: 'all', label: 'Todo' },
] as const

const cutoff = computed(() => {
  const now = dayjs()
  if (range.value === 'today') return now.startOf('day')
  if (range.value === 'week') return now.subtract(7, 'day')
  if (range.value === 'month') return now.subtract(30, 'day')
  return null
})

const filtered = computed(() => {
  let list = store.items
  if (cutoff.value) {
    list = list.filter((v) => {
      const d = v.entryTime?.toDate?.()
      return d && dayjs(d).isAfter(cutoff.value!)
    })
  }
  const q = search.value.trim().toLowerCase()
  if (q) {
    list = list.filter(
      (v) =>
        v.apartmentNumber.toLowerCase().includes(q) ||
        (v.visitorName ?? '').toLowerCase().includes(q) ||
        (v.driverName ?? '').toLowerCase().includes(q) ||
        (v.vehiclePlate ?? '').toLowerCase().includes(q),
    )
  }
  return list
})

/** Agrupado por apartamento, ordenado por cantidad de ingresos. */
const byApartment = computed(() => {
  const map = new Map<string, typeof filtered.value>()
  for (const v of filtered.value) {
    const key = v.apartmentNumber || '—'
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(v)
  }
  return [...map.entries()].sort((a, b) => b[1].length - a[1].length)
})

const totalVisits = computed(() => filtered.value.length)
const activeNow = computed(() => filtered.value.filter((v) => !v.exitTime).length)

const expandedApt = ref<string | null>(null)

function fmt(ts: { toDate?: () => Date } | undefined) {
  const d = ts?.toDate?.()
  return d ? dayjs(d).format('DD MMM · h:mm a') : ''
}
</script>

<template>
  <div>
    <ScreenHeader title="Registro de ingresos" />
    <VContainer class="py-4">
      <!-- Stats -->
      <div class="el-stats">
        <div class="el-stat">
          <span class="el-stat-value">{{ totalVisits }}</span>
          <span class="el-stat-label">Ingresos</span>
        </div>
        <div class="el-stat">
          <span class="el-stat-value">{{ byApartment.length }}</span>
          <span class="el-stat-label">Aptos visitados</span>
        </div>
        <div class="el-stat el-stat--live">
          <span class="el-stat-value">{{ activeNow }}</span>
          <span class="el-stat-label">Dentro ahora</span>
        </div>
      </div>

      <!-- Filtros -->
      <div class="el-ranges">
        <button
          v-for="r in RANGES"
          :key="r.value"
          class="el-range"
          :class="{ 'el-range--on': range === r.value }"
          @click="range = r.value"
        >{{ r.label }}</button>
      </div>

      <VTextField
        v-model="search"
        placeholder="Buscar apto, visitante o placa…"
        prepend-inner-icon="mdi-magnify"
        variant="solo"
        flat
        rounded="xl"
        density="comfortable"
        hide-details
        class="mb-4"
      />

      <LoadingSpinner v-if="store.loading" />
      <EmptyState v-else-if="!byApartment.length" icon="mdi-clipboard-text-clock-outline" message="No hay ingresos en este periodo" />

      <div v-else class="el-list">
        <div v-for="[apt, visits] in byApartment" :key="apt" class="el-apt">
          <button class="el-apt-head" @click="expandedApt = expandedApt === apt ? null : apt">
            <span class="el-apt-number">{{ apt }}</span>
            <div class="el-apt-info">
              <span class="el-apt-count">{{ visits.length }} ingreso{{ visits.length === 1 ? '' : 's' }}</span>
              <span class="el-apt-last">Último: {{ fmt(visits[0]?.entryTime) }}</span>
            </div>
            <div class="el-apt-bar-wrap">
              <div
                class="el-apt-bar"
                :style="{ width: `${Math.min(100, (visits.length / (byApartment[0]?.[1].length || 1)) * 100)}%` }"
              />
            </div>
            <VIcon
              :icon="expandedApt === apt ? 'mdi-chevron-up' : 'mdi-chevron-down'"
              size="18"
              class="el-apt-chevron"
            />
          </button>

          <VExpandTransition>
            <div v-if="expandedApt === apt" class="el-detail">
              <div v-for="v in visits" :key="v.id" class="el-visit">
                <VIcon :icon="v.type === 'vehicle' ? 'mdi-car-outline' : 'mdi-walk'" size="16" />
                <div class="el-visit-info">
                  <span class="el-visit-name">{{ v.visitorName ?? v.driverName ?? 'Visitante' }}<template v-if="v.vehiclePlate"> · {{ v.vehiclePlate }}</template></span>
                  <span class="el-visit-time">
                    {{ fmt(v.entryTime) }}
                    <template v-if="v.exitTime"> → {{ fmt(v.exitTime) }} ({{ v.duration }} min)</template>
                    <template v-else> · <strong class="el-inside">Dentro</strong></template>
                  </span>
                </div>
              </div>
            </div>
          </VExpandTransition>
        </div>
      </div>
    </VContainer>
  </div>
</template>

<style scoped>
.el-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px; }
.el-stat {
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  background: var(--color-surface); border-radius: 16px; padding: 14px 8px;
  box-shadow: var(--shadow-xs);
}
.el-stat-value { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; color: var(--color-text-primary); }
.el-stat--live .el-stat-value { color: var(--color-guard); }
.el-stat-label { font-size: 11px; color: var(--color-text-secondary); }

.el-ranges { display: flex; gap: 6px; margin-bottom: 12px; }
.el-range {
  flex: 1; padding: 8px 4px;
  border: none; border-radius: 10px;
  background: var(--color-surface);
  font-size: 12px; font-weight: 600;
  color: var(--color-text-secondary);
  cursor: pointer; font-family: inherit;
  transition: all 0.15s ease;
  box-shadow: var(--shadow-xs);
}
.el-range--on { background: var(--color-text-primary); color: white; }

.el-list { display: flex; flex-direction: column; gap: 8px; }

.el-apt { background: var(--color-surface); border-radius: 16px; box-shadow: var(--shadow-xs); overflow: hidden; }

.el-apt-head {
  display: flex; align-items: center; gap: 12px;
  width: 100%; padding: 12px 14px;
  border: none; background: none; cursor: pointer;
  text-align: left; font-family: inherit;
}

.el-apt-number {
  min-width: 48px; text-align: center;
  font-size: 15px; font-weight: 800;
  color: var(--color-admin);
  background: rgba(14, 165, 233, 0.1);
  border-radius: 10px; padding: 7px 8px;
}

.el-apt-info { display: flex; flex-direction: column; min-width: 110px; }
.el-apt-count { font-size: 13px; font-weight: 700; color: var(--color-text-primary); }
.el-apt-last { font-size: 10.5px; color: var(--color-text-tertiary); }

.el-apt-bar-wrap {
  flex: 1; height: 6px;
  background: var(--color-surface-2);
  border-radius: 3px; overflow: hidden;
}
.el-apt-bar {
  height: 100%;
  background: linear-gradient(90deg, #0EA5E9, #38BDF8);
  border-radius: 3px;
  transition: width 0.5s cubic-bezier(0.22, 1, 0.36, 1);
}

.el-apt-chevron { color: var(--color-text-tertiary); }

.el-detail { padding: 0 14px 12px; display: flex; flex-direction: column; gap: 8px; }
.el-visit {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 8px 10px;
  background: var(--color-bg);
  border-radius: 10px;
  color: var(--color-text-secondary);
}
.el-visit-info { display: flex; flex-direction: column; }
.el-visit-name { font-size: 12.5px; font-weight: 600; color: var(--color-text-primary); }
.el-visit-time { font-size: 11px; color: var(--color-text-secondary); }
.el-inside { color: var(--color-guard); }
</style>
