<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { usePQRsStore } from '@/stores/pqrs.store'
import type { PQR } from '@/types'

const store = usePQRsStore()
onMounted(() => store.fetchAll())

const dialog = ref(false)
const selected = ref<PQR | null>(null)
const adminResponse = ref('')
const loading = ref(false)

function openResolve(pqr: PQR) {
  selected.value = pqr
  adminResponse.value = ''
  dialog.value = true
}

async function handleResolve() {
  if (!selected.value) return
  loading.value = true
  try {
    await store.resolve(selected.value.id, adminResponse.value)
    dialog.value = false
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <ScreenHeader title="Gestión de PQRs" />
    <VContainer class="py-4">
      <LoadingSpinner v-if="store.loading" />
      <EmptyState v-else-if="!store.items.length" icon="mdi-message-alert-outline" message="No hay PQRs" />
      <VList v-else rounded="lg" border>
        <template v-for="(p, i) in store.items" :key="p.id">
          <VListItem>
            <VListItemTitle class="font-weight-semibold">{{ p.title }} · Apto {{ p.apartmentNumber }}</VListItemTitle>
            <VListItemSubtitle class="text-truncate-2">{{ p.description }}</VListItemSubtitle>
            <template #append>
              <div class="d-flex flex-column align-end gap-1">
                <StatusBadge :status="p.status" />
                <VBtn v-if="p.status !== 'resolved'" size="x-small" color="primary" variant="tonal" class="text-none mt-1" @click="openResolve(p)">
                  Resolver
                </VBtn>
              </div>
            </template>
          </VListItem>
          <VDivider v-if="i < store.items.length - 1" />
        </template>
      </VList>
    </VContainer>

    <VDialog v-model="dialog" max-width="480">
      <VCard rounded="lg" class="pa-4">
        <VCardTitle class="font-weight-bold mb-3">Resolver PQR</VCardTitle>
        <p class="text-body-2 mb-3">{{ selected?.title }}</p>
        <VTextarea v-model="adminResponse" label="Respuesta al residente" rows="4" class="mb-4" />
        <div class="d-flex gap-3">
          <BtnSecondary @click="dialog = false">Cancelar</BtnSecondary>
          <BtnPrimary :loading="loading" @click="handleResolve">Marcar Resuelto</BtnPrimary>
        </div>
      </VCard>
    </VDialog>
  </div>
</template>
