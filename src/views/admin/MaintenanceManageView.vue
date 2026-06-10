<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useMaintenanceStore } from '@/stores/maintenance.store'
import { useComplexStore } from '@/stores/complex.store'
import { useConfirmStore } from '@/stores/confirm.store'
import { Timestamp } from 'firebase/firestore'
import type { MaintenanceRecurrence, MaintenanceStatus, MaintenanceTask } from '@/types'
import dayjs from 'dayjs'

const store = useMaintenanceStore()
const complexStore = useComplexStore()
const confirm = useConfirmStore()

async function handleRemove(m: MaintenanceTask) {
  const ok = await confirm.ask({
    title: '¿Eliminar mantenimiento?',
    message: `"${m.title}" (${m.assetLabel}) se quitará del calendario.`,
  })
  if (ok) await store.remove(m.id)
}

onMounted(async () => {
  await Promise.allSettled([store.fetchAll(), complexStore.fetchCurrent()])
})

const dialog = ref(false)
const saving = ref(false)

const asset = ref('elevator')
const title = ref('')
const description = ref('')
const provider = ref('')
const date = ref('')
const recurrence = ref<MaintenanceRecurrence>('monthly')

const assetOptions = computed(() => [
  { value: 'elevator', title: 'Ascensor', icon: 'mdi-elevator-passenger-outline' },
  { value: 'pool', title: 'Piscina', icon: 'mdi-pool' },
  { value: 'general', title: 'Zonas comunes', icon: 'mdi-office-building-cog-outline' },
  ...complexStore.activeAmenities
    .filter((a) => a.id !== 'pool')
    .map((a) => ({ value: a.id, title: a.name, icon: a.icon })),
])

const ASSET_ICONS: Record<string, string> = {
  elevator: 'mdi-elevator-passenger-outline',
  pool: 'mdi-pool',
  general: 'mdi-office-building-cog-outline',
}

const RECURRENCE_LABEL: Record<MaintenanceRecurrence, string> = {
  none: 'Única vez',
  weekly: 'Semanal',
  monthly: 'Mensual',
  quarterly: 'Trimestral',
  yearly: 'Anual',
}

const STATUS_META: Record<MaintenanceStatus, { label: string; color: string }> = {
  scheduled: { label: 'Programado', color: 'info' },
  in_progress: { label: 'En curso', color: 'warning' },
  completed: { label: 'Completado', color: 'success' },
  cancelled: { label: 'Cancelado', color: 'default' },
}

const canSave = computed(() => title.value.trim() && date.value)

async function save() {
  saving.value = true
  try {
    const opt = assetOptions.value.find((o) => o.value === asset.value)
    await store.add({
      asset: asset.value,
      assetLabel: opt?.title ?? asset.value,
      title: title.value.trim(),
      description: description.value.trim(),
      provider: provider.value.trim(),
      scheduledDate: Timestamp.fromDate(new Date(date.value)),
      recurrence: recurrence.value,
      status: 'scheduled',
    })
    dialog.value = false
    title.value = ''
    description.value = ''
    provider.value = ''
    date.value = ''
  } finally {
    saving.value = false
  }
}

function iconFor(a: string) {
  return ASSET_ICONS[a] ?? complexStore.amenities.find((x) => x.id === a)?.icon ?? 'mdi-wrench-outline'
}

function fmtDate(ts: { toDate?: () => Date } | undefined) {
  const d = ts?.toDate?.()
  return d ? dayjs(d).format('ddd DD MMM · h:mm a') : ''
}

const grouped = computed(() => {
  const groups: Record<string, typeof store.items> = {}
  for (const m of store.items) {
    ;(groups[m.assetLabel] ??= []).push(m)
  }
  return groups
})
</script>

<template>
  <div>
    <ScreenHeader title="Mantenimientos" />
    <VContainer class="py-4">
      <p class="text-body-2 text-medium-emphasis mb-4">
        Programa los mantenimientos del ascensor, piscina y zonas comunes. Los residentes los verán en su app.
      </p>

      <BtnPrimary icon="mdi-plus" class="mb-5" @click="dialog = true">Programar mantenimiento</BtnPrimary>

      <LoadingSpinner v-if="store.loading" />
      <EmptyState v-else-if="!store.items.length" icon="mdi-wrench-clock" message="No hay mantenimientos programados" />

      <template v-else>
        <section v-for="(tasks, label) in grouped" :key="label" class="mnt-group">
          <h3 class="mnt-group-title">
            <VIcon :icon="iconFor(tasks[0].asset)" size="16" /> {{ label }}
          </h3>
          <div class="mnt-list">
            <div v-for="m in tasks" :key="m.id" class="mnt-card">
              <div class="mnt-date">
                <span class="mnt-date-day">{{ dayjs(m.scheduledDate?.toDate?.()).format('DD') }}</span>
                <span class="mnt-date-month">{{ dayjs(m.scheduledDate?.toDate?.()).format('MMM') }}</span>
              </div>
              <div class="mnt-info">
                <span class="mnt-title">{{ m.title }}</span>
                <span class="mnt-meta">{{ fmtDate(m.scheduledDate) }}<template v-if="m.provider"> · {{ m.provider }}</template></span>
                <span class="mnt-rec">
                  <VIcon icon="mdi-refresh" size="11" /> {{ RECURRENCE_LABEL[m.recurrence] }}
                </span>
              </div>
              <div class="mnt-actions">
                <VChip size="x-small" :color="STATUS_META[m.status].color" variant="tonal">
                  {{ STATUS_META[m.status].label }}
                </VChip>
                <VMenu>
                  <template #activator="{ props }">
                    <button class="mnt-menu-btn" v-bind="props">
                      <VIcon icon="mdi-dots-horizontal" size="18" />
                    </button>
                  </template>
                  <VList density="compact" rounded="lg">
                    <VListItem v-if="m.status === 'scheduled'" title="Iniciar" prepend-icon="mdi-play-outline" @click="store.setStatus(m.id, 'in_progress')" />
                    <VListItem v-if="m.status !== 'completed'" title="Completar" prepend-icon="mdi-check" @click="store.setStatus(m.id, 'completed')" />
                    <VListItem title="Eliminar" prepend-icon="mdi-delete-outline" @click="handleRemove(m)" />
                  </VList>
                </VMenu>
              </div>
            </div>
          </div>
        </section>
      </template>
    </VContainer>

    <!-- Crear mantenimiento -->
    <VDialog v-model="dialog" max-width="440">
      <VCard rounded="xl" class="pa-5">
        <VCardTitle class="px-0 pt-0 font-weight-bold">Programar mantenimiento</VCardTitle>
        <VSelect
          v-model="asset"
          :items="assetOptions"
          item-title="title"
          item-value="value"
          label="Equipo / Zona"
          variant="outlined"
          density="comfortable"
          hide-details
          class="mb-3"
        />
        <VTextField v-model="title" label="Título" placeholder="Mantenimiento preventivo" variant="outlined" density="comfortable" hide-details class="mb-3" />
        <VTextField v-model="provider" label="Proveedor (opcional)" placeholder="Ascensores S.A." variant="outlined" density="comfortable" hide-details class="mb-3" />
        <VTextField v-model="date" label="Fecha y hora" type="datetime-local" variant="outlined" density="comfortable" hide-details class="mb-3" />
        <VSelect
          v-model="recurrence"
          :items="Object.entries(RECURRENCE_LABEL).map(([value, title]) => ({ value, title }))"
          item-title="title"
          item-value="value"
          label="Recurrencia"
          variant="outlined"
          density="comfortable"
          hide-details
          class="mb-3"
        />
        <VTextarea v-model="description" label="Notas (opcional)" rows="2" variant="outlined" density="comfortable" hide-details class="mb-5" />
        <div class="d-flex" style="gap: 10px">
          <BtnSecondary @click="dialog = false">Cancelar</BtnSecondary>
          <BtnPrimary :loading="saving" :disabled="!canSave" @click="save">Programar</BtnPrimary>
        </div>
      </VCard>
    </VDialog>
  </div>
</template>

<style scoped>
.mnt-group { margin-bottom: 20px; }
.mnt-group-title {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; font-weight: 700;
  color: var(--color-text-tertiary);
  text-transform: uppercase; letter-spacing: 0.5px;
  margin: 0 0 8px;
}

.mnt-list { display: flex; flex-direction: column; gap: 8px; }

.mnt-card {
  display: flex; align-items: center; gap: 12px;
  background: var(--color-surface);
  border-radius: 16px; padding: 12px 14px;
  box-shadow: var(--shadow-xs);
}

.mnt-date {
  display: flex; flex-direction: column; align-items: center;
  background: var(--color-primary-soft);
  border-radius: 12px;
  min-width: 48px; padding: 6px 4px;
}
.mnt-date-day { font-size: 18px; font-weight: 800; color: var(--color-primary); line-height: 1; }
.mnt-date-month { font-size: 10px; font-weight: 600; color: var(--color-primary); text-transform: uppercase; }

.mnt-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
.mnt-title { font-size: 13.5px; font-weight: 700; color: var(--color-text-primary); }
.mnt-meta { font-size: 11.5px; color: var(--color-text-secondary); }
.mnt-rec { display: inline-flex; align-items: center; gap: 3px; font-size: 10.5px; color: var(--color-text-tertiary); }

.mnt-actions { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
.mnt-menu-btn {
  border: none; background: none; cursor: pointer;
  color: var(--color-text-tertiary);
  width: 28px; height: 28px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
}
.mnt-menu-btn:active { background: var(--color-surface-2); }
</style>
