<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useMailStore } from '@/stores/mail.store'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/es'

dayjs.extend(relativeTime)
dayjs.locale('es')

const store = useMailStore()
const confirmingId = ref<string | null>(null)
const photoDialog = ref(false)
const photoUrl = ref('')

onMounted(() => store.fetchMine())

const TYPE_ICON: Record<string, string> = {
  package: 'mdi-package-variant-closed',
  letter: 'mdi-email-outline',
  document: 'mdi-file-document-outline',
  other: 'mdi-inbox-outline',
}
const TYPE_LABEL: Record<string, string> = {
  package: 'Paquete', letter: 'Carta', document: 'Documento', other: 'Otro',
}
const TYPE_BG: Record<string, string> = {
  package: '#FEF3C7', letter: '#DBEAFE', document: '#E0E7FF', other: '#F3F4F6',
}
const TYPE_COLOR: Record<string, string> = {
  package: '#D97706', letter: '#2563EB', document: '#4338CA', other: '#6B7280',
}

const fmt = (ts: any) => ts?.toDate ? dayjs(ts.toDate()).fromNow() : '—'
const fmtDate = (ts: any) => ts?.toDate ? dayjs(ts.toDate()).format('D MMM YYYY') : '—'

function expiryDaysLeft(ts: any): number | null {
  if (!ts?.toDate) return null
  const diff = dayjs(ts.toDate()).diff(dayjs(), 'day')
  return diff >= 0 ? diff : null
}

function canConfirm(item: any): boolean {
  if (item.status !== 'delivered') return false
  if (!item.residentConfirmedExpiry) return true
  return expiryDaysLeft(item.residentConfirmedExpiry) !== null
}

async function handleConfirm(id: string) {
  confirmingId.value = id
  try {
    await store.confirmReceipt(id)
  } finally {
    confirmingId.value = null
  }
}

function openPhoto(url: string) {
  if (!url) return
  photoUrl.value = url
  photoDialog.value = true
}

const pending = computed(() => store.items.filter(m => m.status === 'pending'))
const delivered = computed(() => store.items.filter(m => m.status === 'delivered'))
const confirmed = computed(() => store.items.filter(m => m.status === 'confirmed'))
</script>

<template>
  <div class="mail-screen">
    <!-- Header -->
    <div class="screen-top">
      <div class="screen-title-row">
        <BackBtn />
        <h1 class="screen-title">Correspondencia</h1>
      </div>
    </div>

    <LoadingSpinner v-if="store.loading" />

    <EmptyState
      v-else-if="!store.items.length"
      icon="mdi-package-variant-closed"
      message="No tienes correspondencia registrada"
    />

    <div v-else class="mail-body">

      <!-- ── Pendiente de confirmar (delivered) ── -->
      <template v-if="delivered.length">
        <p class="section-label">Retiro pendiente ({{ delivered.length }})</p>

        <div class="section-card section-card--alert">
          <div
            v-for="(m, idx) in delivered"
            :key="m.id"
            class="mail-row"
            :class="{ 'mail-row--last': idx === delivered.length - 1 }"
          >
            <!-- Photo / icon -->
            <button class="mail-thumb" @click="openPhoto(m.photoUrl)">
              <img v-if="m.photoUrl" :src="m.photoUrl" class="mail-thumb-img" alt="foto" />
              <div v-else class="mail-thumb-icon" :style="{ background: TYPE_BG[m.type] }">
                <VIcon :icon="TYPE_ICON[m.type]" size="20" :color="TYPE_COLOR[m.type]" />
              </div>
            </button>

            <!-- Info -->
            <div class="mail-row-info">
              <div class="mail-row-top">
                <span class="mail-type">{{ TYPE_LABEL[m.type] }}</span>
                <span v-if="expiryDaysLeft(m.residentConfirmedExpiry) !== null" class="expiry-chip">
                  {{ expiryDaysLeft(m.residentConfirmedExpiry) }}d restantes
                </span>
              </div>
              <p class="mail-desc">{{ m.description }}</p>
              <p v-if="m.sender" class="mail-meta">De {{ m.sender }}</p>
              <p class="mail-meta">Entregado {{ fmtDate(m.deliveredAt) }}</p>

              <button
                class="confirm-btn"
                :disabled="confirmingId === m.id"
                @click="handleConfirm(m.id)"
              >
                <span v-if="confirmingId !== m.id">
                  <VIcon icon="mdi-check-circle-outline" size="15" />
                  Confirmar recibido
                </span>
                <span v-else class="btn-spinner" />
              </button>
            </div>
          </div>
        </div>
      </template>

      <!-- ── En portería (pending) ── -->
      <template v-if="pending.length">
        <p class="section-label">En portería ({{ pending.length }})</p>

        <div class="section-card">
          <div
            v-for="(m, idx) in pending"
            :key="m.id"
            class="mail-row"
            :class="{ 'mail-row--last': idx === pending.length - 1 }"
          >
            <button class="mail-thumb" @click="openPhoto(m.photoUrl)">
              <img v-if="m.photoUrl" :src="m.photoUrl" class="mail-thumb-img" alt="foto" />
              <div v-else class="mail-thumb-icon" :style="{ background: TYPE_BG[m.type] }">
                <VIcon :icon="TYPE_ICON[m.type]" size="20" :color="TYPE_COLOR[m.type]" />
              </div>
            </button>

            <div class="mail-row-info">
              <div class="mail-row-top">
                <span class="mail-type">{{ TYPE_LABEL[m.type] }}</span>
                <StatusBadge :status="m.status" />
              </div>
              <p class="mail-desc">{{ m.description }}</p>
              <p v-if="m.sender" class="mail-meta">De {{ m.sender }}</p>
              <p class="mail-meta">Registrado {{ fmt(m.createdAt) }}</p>
            </div>
          </div>
        </div>
      </template>

      <!-- ── Historial (confirmed) ── -->
      <template v-if="confirmed.length">
        <p class="section-label">Historial</p>

        <div class="section-card section-card--muted">
          <div
            v-for="(m, idx) in confirmed"
            :key="m.id"
            class="mail-row"
            :class="{ 'mail-row--last': idx === confirmed.length - 1 }"
          >
            <div class="mail-thumb-icon" :style="{ background: TYPE_BG[m.type] }">
              <VIcon :icon="TYPE_ICON[m.type]" size="20" :color="TYPE_COLOR[m.type]" />
            </div>

            <div class="mail-row-info">
              <div class="mail-row-top">
                <span class="mail-type">{{ TYPE_LABEL[m.type] }}</span>
                <StatusBadge :status="m.status" />
              </div>
              <p class="mail-desc">{{ m.description }}</p>
              <p class="mail-meta">Confirmado {{ fmtDate(m.residentConfirmedAt) }}</p>
            </div>
          </div>
        </div>
      </template>

    </div>

    <!-- Photo dialog -->
    <VDialog v-model="photoDialog" max-width="480">
      <VCard rounded="xl">
        <VImg :src="photoUrl" max-height="420" cover class="rounded-t-xl" />
        <VCardActions class="justify-end pa-3">
          <VBtn variant="text" color="primary" @click="photoDialog = false">Cerrar</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<style scoped>
.mail-screen {
  padding: 0 0 16px;
}

/* Top */
.screen-top {
  padding: 4px 20px 16px;
  position: sticky;
  top: 0;
  background: var(--color-bg);
  z-index: 5;
}

.screen-title-row {
  height: 52px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.screen-title {
  font-size: 24px;
  font-weight: 800;
  color: var(--color-text-primary);
  letter-spacing: -0.5px;
  margin: 0;
}

.mail-body {
  padding: 0 16px;
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* Section label (like Satispay's group headers) */
.section-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 20px 4px 8px;
}

/* Section card — white container with rows */
.section-card {
  background: var(--color-surface);
  border-radius: 20px;
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.section-card--alert {
  box-shadow: 0 0 0 2px rgba(217, 119, 6, 0.15), var(--shadow-sm);
}

.section-card--muted {
  opacity: 0.75;
}

/* Mail row */
.mail-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--color-border-light);
}

.mail-row--last {
  border-bottom: none;
}

/* Thumbnail */
.mail-thumb {
  border: none;
  background: none;
  padding: 0;
  cursor: pointer;
  flex-shrink: 0;
}

.mail-thumb-img {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  object-fit: cover;
  display: block;
}

.mail-thumb-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* Row info */
.mail-row-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.mail-row-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.mail-type {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.expiry-chip {
  font-size: 11px;
  font-weight: 600;
  color: #D97706;
  background: #FEF3C7;
  padding: 2px 8px;
  border-radius: 9999px;
}

.mail-desc {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.4;
}

.mail-meta {
  font-size: 11px;
  color: var(--color-text-tertiary);
  margin: 0;
}

/* Confirm button */
.confirm-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  padding: 7px 16px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 9999px;
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.confirm-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.confirm-btn:not(:disabled):active {
  opacity: 0.85;
  transform: scale(0.97);
}

.btn-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: block;
}

@keyframes spin { to { transform: rotate(360deg); } }
</style>
