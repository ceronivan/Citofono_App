<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useMaintenanceStore } from '@/stores/maintenance.store'
import { useComplexStore } from '@/stores/complex.store'
import type { MaintenanceStatus } from '@/types'
import dayjs from 'dayjs'

const store = useMaintenanceStore()
const complexStore = useComplexStore()

onMounted(async () => {
  await Promise.allSettled([store.fetchAll(), complexStore.fetchCurrent()])
})

const ASSET_ICONS: Record<string, string> = {
  elevator: 'mdi-elevator-passenger-outline',
  pool: 'mdi-pool',
  general: 'mdi-office-building-cog-outline',
}

const STATUS_META: Record<MaintenanceStatus, { label: string; color: string }> = {
  scheduled: { label: 'Programado', color: 'info' },
  in_progress: { label: 'En curso', color: 'warning' },
  completed: { label: 'Completado', color: 'success' },
  cancelled: { label: 'Cancelado', color: 'default' },
}

function iconFor(a: string) {
  return ASSET_ICONS[a] ?? complexStore.amenities.find((x) => x.id === a)?.icon ?? 'mdi-wrench-outline'
}

const upcoming = computed(() =>
  store.items.filter((m) => m.status === 'scheduled' || m.status === 'in_progress'),
)
const past = computed(() => store.items.filter((m) => m.status === 'completed'))

function fmtDate(ts: { toDate?: () => Date } | undefined) {
  const d = ts?.toDate?.()
  return d ? dayjs(d).format('dddd DD [de] MMMM · h:mm a') : ''
}
</script>

<template>
  <div>
    <ScreenHeader title="Mantenimientos" />
    <VContainer class="py-4">
      <p class="text-body-2 text-medium-emphasis mb-4">
        Calendario de mantenimientos del edificio: ascensores, piscina y zonas comunes.
      </p>

      <LoadingSpinner v-if="store.loading" />
      <EmptyState v-else-if="!store.items.length" icon="mdi-wrench-clock" message="No hay mantenimientos programados" />

      <template v-else>
        <h3 v-if="upcoming.length" class="mv-section">Próximos</h3>
        <div class="mv-list">
          <div v-for="(m, i) in upcoming" :key="m.id" class="mv-card" :style="{ animationDelay: `${i * 50}ms` }">
            <div class="mv-icon" :class="{ 'mv-icon--active': m.status === 'in_progress' }">
              <VIcon :icon="iconFor(m.asset)" size="22" />
            </div>
            <div class="mv-info">
              <span class="mv-asset">{{ m.assetLabel }}</span>
              <span class="mv-title">{{ m.title }}</span>
              <span class="mv-date">{{ fmtDate(m.scheduledDate) }}</span>
            </div>
            <VChip size="x-small" :color="STATUS_META[m.status].color" variant="tonal">
              {{ STATUS_META[m.status].label }}
            </VChip>
          </div>
        </div>

        <h3 v-if="past.length" class="mv-section mt-6">Historial</h3>
        <div class="mv-list mv-list--muted">
          <div v-for="m in past" :key="m.id" class="mv-card">
            <div class="mv-icon mv-icon--done">
              <VIcon icon="mdi-check" size="20" />
            </div>
            <div class="mv-info">
              <span class="mv-asset">{{ m.assetLabel }}</span>
              <span class="mv-title">{{ m.title }}</span>
              <span class="mv-date">{{ fmtDate(m.scheduledDate) }}</span>
            </div>
          </div>
        </div>
      </template>
    </VContainer>
  </div>
</template>

<style scoped>
.mv-section {
  font-size: 12px; font-weight: 700;
  color: var(--color-text-tertiary);
  text-transform: uppercase; letter-spacing: 0.5px;
  margin: 0 0 10px;
}

.mv-list { display: flex; flex-direction: column; gap: 8px; }
.mv-list--muted { opacity: 0.7; }

.mv-card {
  display: flex; align-items: center; gap: 12px;
  background: var(--color-surface);
  border-radius: 16px; padding: 13px 14px;
  box-shadow: var(--shadow-xs);
  animation: rise-in 0.35s ease both;
}

@keyframes rise-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.mv-icon {
  width: 44px; height: 44px; border-radius: 13px;
  background: var(--color-info-soft); color: var(--color-info);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.mv-icon--active {
  background: var(--color-warning-soft); color: var(--color-warning);
  animation: pulse-soft 1.8s ease infinite;
}
.mv-icon--done { background: var(--color-success-soft); color: var(--color-success); }

@keyframes pulse-soft {
  0%, 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.25); }
  50% { box-shadow: 0 0 0 7px rgba(245, 158, 11, 0); }
}

.mv-info { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.mv-asset { font-size: 10.5px; font-weight: 700; color: var(--color-text-tertiary); text-transform: uppercase; letter-spacing: 0.4px; }
.mv-title { font-size: 13.5px; font-weight: 700; color: var(--color-text-primary); }
.mv-date { font-size: 11.5px; color: var(--color-text-secondary); text-transform: capitalize; }
</style>
