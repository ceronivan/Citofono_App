<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useDamageReportsStore } from '@/stores/damage-reports.store'
import type { DamageReport } from '@/types'

const store = useDamageReportsStore()
onMounted(() => store.fetchAll())

const dialog = ref(false)
const selected = ref<DamageReport | null>(null)
const adminResponse = ref('')
const loading = ref(false)

function openResolve(r: DamageReport) {
  selected.value = r
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
    <ScreenHeader title="Reportes de Daños" />
    <VContainer class="py-4">
      <LoadingSpinner v-if="store.loading" />
      <EmptyState v-else-if="!store.items.length" icon="mdi-wrench-outline" message="No hay reportes" />
      <VList v-else rounded="lg" border>
        <template v-for="(r, i) in store.items" :key="r.id">
          <VListItem>
            <VListItemTitle class="font-weight-semibold">{{ r.title }} · Apto {{ r.apartmentNumber }}</VListItemTitle>
            <VListItemSubtitle class="text-truncate-2">{{ r.description }}</VListItemSubtitle>
            <template #append>
              <div class="d-flex flex-column align-end gap-1">
                <StatusBadge :status="r.status" />
                <VBtn v-if="r.status !== 'resolved'" size="x-small" color="primary" variant="tonal" class="text-none mt-1" @click="openResolve(r)">
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
        <VCardTitle class="font-weight-bold mb-3">Resolver Reporte</VCardTitle>
        <VTextarea v-model="adminResponse" label="Respuesta al residente" rows="4" class="mb-4" />
        <div class="d-flex gap-3">
          <BtnSecondary @click="dialog = false">Cancelar</BtnSecondary>
          <BtnPrimary :loading="loading" @click="handleResolve">Marcar Resuelto</BtnPrimary>
        </div>
      </VCard>
    </VDialog>
  </div>
</template>
