<script setup lang="ts">
import { onMounted } from 'vue'
import { usePQRsStore } from '@/stores/pqrs.store'

const store = usePQRsStore()
onMounted(() => store.fetchMine())
</script>

<template>
  <div>
    <ScreenHeader title="Mis PQRs" />
    <VContainer class="py-4">
      <BtnPrimary icon="mdi-plus" class="mb-4" to="/pqrs/new">Crear un PQR</BtnPrimary>
      <LoadingSpinner v-if="store.loading" />
      <EmptyState v-else-if="!store.items.length" icon="mdi-message-alert-outline" message="No has creado ningún PQR" />
      <VList v-else rounded="lg" border>
        <template v-for="(p, i) in store.items" :key="p.id">
          <VListItem :to="`/pqrs/${p.id}`" nav>
            <VListItemTitle class="font-weight-semibold">{{ p.title }}</VListItemTitle>
            <VListItemSubtitle class="text-truncate-2 mt-1">{{ p.description }}</VListItemSubtitle>
            <template #append>
              <StatusBadge :status="p.status" />
            </template>
          </VListItem>
          <VDivider v-if="i < store.items.length - 1" />
        </template>
      </VList>
    </VContainer>
  </div>
</template>
