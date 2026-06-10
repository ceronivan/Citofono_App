<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useDeliveriesStore } from '@/stores/deliveries.store'
import { useAuthStore } from '@/stores/auth.store'
import { useConfirmStore } from '@/stores/confirm.store'
import dayjs from 'dayjs'
import type { Delivery } from '@/types'

const store = useDeliveriesStore()
const authStore = useAuthStore()
const confirm = useConfirmStore()

async function handleCancel(d: Delivery) {
  const ok = await confirm.ask({
    title: '¿Cancelar domicilio?',
    message: `Portería ya no autorizará el código ${d.code} de ${d.vendor}.`,
    confirmText: 'Sí, cancelar',
    cancelText: 'Volver',
  })
  if (ok) await store.cancel(d.id)
}

onMounted(() => store.fetchMine())

const dialog = ref(false)
const saving = ref(false)
const vendor = ref('')
const description = ref('')
const code = ref('')

const VENDOR_PRESETS = [
  { name: 'Pizza', icon: 'mdi-pizza' },
  { name: 'Hamburguesa', icon: 'mdi-hamburger' },
  { name: 'Mercado', icon: 'mdi-cart-outline' },
  { name: 'Farmacia', icon: 'mdi-pill' },
  { name: 'Paquete', icon: 'mdi-package-variant-closed' },
  { name: 'Otro', icon: 'mdi-moped-outline' },
]

function generateCode() {
  code.value = String(Math.floor(1000 + Math.random() * 9000))
}

const canSave = computed(() => vendor.value.trim() && /^\d{4,6}$/.test(code.value.trim()))

async function save() {
  saving.value = true
  try {
    await store.add({
      residentId: authStore.userData!.id,
      apartmentNumber: authStore.apartmentNumber ?? '',
      ...(authStore.activeMembership?.tower ? { tower: authStore.activeMembership.tower } : {}),
      ...(authStore.unitId ? { unitId: authStore.unitId } : {}),
      vendor: vendor.value.trim(),
      description: description.value.trim(),
      code: code.value.trim(),
    })
    dialog.value = false
    vendor.value = ''
    description.value = ''
    code.value = ''
  } finally {
    saving.value = false
  }
}

const STATUS_META: Record<string, { label: string; color: string; icon: string }> = {
  expected: { label: 'En camino', color: '#D97706', icon: 'mdi-moped-outline' },
  delivered: { label: 'Entregado', color: '#16A34A', icon: 'mdi-check-circle-outline' },
  cancelled: { label: 'Cancelado', color: '#9CA3AF', icon: 'mdi-close-circle-outline' },
}

function fmtDate(ts: { toDate?: () => Date } | undefined) {
  const d = ts?.toDate?.()
  return d ? dayjs(d).format('DD MMM, h:mm a') : ''
}
</script>

<template>
  <div>
    <ScreenHeader title="Mis Domicilios" />
    <VContainer class="py-4">
      <p class="text-body-2 text-medium-emphasis mb-4">
        Registra el código de tu domicilio para que portería autorice la entrega sin llamarte.
      </p>

      <BtnPrimary icon="mdi-plus" class="mb-5" @click="dialog = true">Registrar domicilio</BtnPrimary>

      <LoadingSpinner v-if="store.loading" />
      <EmptyState
        v-else-if="!store.items.length"
        icon="mdi-moped-outline"
        message="No tienes domicilios registrados"
      />

      <TransitionGroup v-else name="dlv-list" tag="div" class="dlv-list">
        <div v-for="d in store.items" :key="d.id" class="dlv-card">
          <div class="dlv-icon" :style="{ color: STATUS_META[d.status].color, background: STATUS_META[d.status].color + '15' }">
            <VIcon :icon="STATUS_META[d.status].icon" size="22" />
          </div>
          <div class="dlv-info">
            <span class="dlv-vendor">{{ d.vendor }}</span>
            <span v-if="d.description" class="dlv-desc">{{ d.description }}</span>
            <span class="dlv-date">{{ fmtDate(d.createdAt) }}</span>
          </div>
          <div class="dlv-right">
            <span v-if="d.status === 'expected'" class="dlv-code">{{ d.code }}</span>
            <span class="dlv-status" :style="{ color: STATUS_META[d.status].color }">
              {{ STATUS_META[d.status].label }}
            </span>
            <button v-if="d.status === 'expected'" class="dlv-cancel" @click="handleCancel(d)">
              Cancelar
            </button>
          </div>
        </div>
      </TransitionGroup>
    </VContainer>

    <!-- Registrar domicilio -->
    <VDialog v-model="dialog" max-width="420">
      <VCard rounded="xl" class="pa-5">
        <VCardTitle class="px-0 pt-0 font-weight-bold">Registrar domicilio</VCardTitle>

        <p class="text-caption text-medium-emphasis mb-2">¿Qué esperas?</p>
        <div class="vendor-grid mb-4">
          <button
            v-for="v in VENDOR_PRESETS"
            :key="v.name"
            class="vendor-chip"
            :class="{ 'vendor-chip--on': vendor === v.name }"
            @click="vendor = v.name"
          >
            <VIcon :icon="v.icon" size="18" />
            <span>{{ v.name }}</span>
          </button>
        </div>

        <VTextField v-model="vendor" label="Negocio / App" placeholder="Domino's, Rappi…" variant="outlined" density="comfortable" hide-details class="mb-3" />
        <VTextField v-model="description" label="Detalle (opcional)" placeholder="Pizza grande pepperoni" variant="outlined" density="comfortable" hide-details class="mb-3" />

        <div class="code-row mb-1">
          <VTextField
            v-model="code"
            label="Código de entrega"
            placeholder="4821"
            type="tel"
            maxlength="6"
            variant="outlined"
            density="comfortable"
            hide-details
          />
          <VBtn variant="tonal" color="primary" rounded="pill" class="text-none" @click="generateCode">
            <VIcon icon="mdi-dice-multiple-outline" size="18" class="mr-1" /> Generar
          </VBtn>
        </div>
        <p class="text-caption text-medium-emphasis mb-4">
          Usa el código que te dio la app de domicilios, o genera uno y dáselo al repartidor.
        </p>

        <div class="d-flex" style="gap: 10px">
          <BtnSecondary @click="dialog = false">Cancelar</BtnSecondary>
          <BtnPrimary :loading="saving" :disabled="!canSave" @click="save">Registrar</BtnPrimary>
        </div>
      </VCard>
    </VDialog>
  </div>
</template>

<style scoped>
.dlv-list { display: flex; flex-direction: column; gap: 10px; }

.dlv-card {
  display: flex; align-items: center; gap: 12px;
  background: var(--color-surface);
  border-radius: 16px;
  padding: 12px 14px;
  box-shadow: var(--shadow-xs);
}

.dlv-icon {
  width: 44px; height: 44px; border-radius: 13px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

.dlv-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
.dlv-vendor { font-size: 14px; font-weight: 700; color: var(--color-text-primary); }
.dlv-desc {
  font-size: 12px; color: var(--color-text-secondary);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.dlv-date { font-size: 11px; color: var(--color-text-tertiary); }

.dlv-right { display: flex; flex-direction: column; align-items: flex-end; gap: 3px; flex-shrink: 0; }

.dlv-code {
  font-size: 16px; font-weight: 800; letter-spacing: 2px;
  color: var(--color-primary);
  background: var(--color-primary-soft);
  border-radius: 8px; padding: 2px 10px;
  font-variant-numeric: tabular-nums;
}

.dlv-status { font-size: 11px; font-weight: 600; }

.dlv-cancel {
  border: none; background: none; cursor: pointer;
  font-size: 11px; color: var(--color-text-tertiary);
  text-decoration: underline; padding: 0;
  font-family: inherit;
}

.vendor-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
.vendor-chip {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  padding: 10px 4px;
  background: var(--color-surface-2);
  border: 1.5px solid transparent;
  border-radius: 12px; cursor: pointer;
  font-size: 11px; font-weight: 600;
  color: var(--color-text-secondary);
  transition: all 0.15s ease;
  font-family: inherit;
}
.vendor-chip:active { transform: scale(0.94); }
.vendor-chip--on {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-primary-10);
}

.code-row { display: flex; gap: 8px; align-items: center; }

.dlv-list-enter-active { transition: all 0.25s ease; }
.dlv-list-enter-from { opacity: 0; transform: translateY(8px); }
.dlv-list-move { transition: transform 0.25s ease; }
</style>
