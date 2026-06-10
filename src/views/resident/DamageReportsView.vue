<script setup lang="ts">
import { onMounted } from 'vue'
import { useDamageReportsStore } from '@/stores/damage-reports.store'

const store = useDamageReportsStore()
onMounted(() => store.fetchMine())
</script>

<template>
  <div>
    <ScreenHeader title="Reportes de Daños" />
    <VContainer class="py-4">
      <BtnPrimary icon="mdi-plus" class="mb-4" to="/damage-reports/new">Reportar Daño</BtnPrimary>
      <LoadingSpinner v-if="store.loading" />
      <EmptyState v-else-if="!store.items.length" icon="mdi-wrench-outline" message="No tienes reportes de daños" />
      <VList v-else rounded="lg" border>
        <template v-for="(r, i) in store.items" :key="r.id">
          <VListItem :to="`/damage-reports/${r.id}`" nav>
            <VListItemTitle class="font-weight-semibold">{{ r.title }}</VListItemTitle>
            <VListItemSubtitle class="text-truncate-2 mt-1">{{ r.description }}</VListItemSubtitle>
            <template #append>
              <StatusBadge :status="r.status" />
            </template>
          </VListItem>
          <VDivider v-if="i < store.items.length - 1" />
        </template>
      </VList>
    </VContainer>
  </div>
</template>
