<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { usePQRsStore } from '@/stores/pqrs.store'

const route = useRoute()
const store = usePQRsStore()
onMounted(() => store.fetchOne(route.params.id as string))
</script>

<template>
  <div>
    <ScreenHeader title="Detalle PQR">
      <template v-if="store.current" #actions>
        <StatusBadge :status="store.current.status" class="mr-2" />
      </template>
    </ScreenHeader>
    <LoadingSpinner v-if="!store.current" />
    <VContainer v-else class="py-4">
      <VTextField :model-value="store.current.category" label="Categoría" readonly class="mb-3" />
      <VTextField :model-value="store.current.title" label="Título" readonly class="mb-3" />
      <VTextarea :model-value="store.current.description" label="Descripción" readonly rows="4" class="mb-4" />

      <div v-if="store.current.attachmentUrls?.length" class="d-flex gap-2 flex-wrap mb-4">
        <VImg v-for="(url, i) in store.current.attachmentUrls" :key="i" :src="url" width="96" height="96" cover rounded="lg" />
      </div>

      <VAlert v-if="store.current.adminResponse" type="info" variant="tonal" class="mt-2">
        <strong>Respuesta:</strong> {{ store.current.adminResponse }}
      </VAlert>
    </VContainer>
  </div>
</template>
