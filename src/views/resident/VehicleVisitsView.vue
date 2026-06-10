<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useVisitsStore } from '@/stores/visits.store'
import dayjs from 'dayjs'

const store = useVisitsStore()
onMounted(() => store.fetchMine())

const visits = computed(() => store.items.filter(v => v.type === 'vehicle'))
const fmt = (ts: any) => ts?.toDate ? dayjs(ts.toDate()).format('DD/MM/YYYY HH:mm') : '—'
</script>

<template>
  <div>
    <ScreenHeader title="Visitas de Vehículos" />
    <VContainer class="py-4">
      <LoadingSpinner v-if="store.loading" />
      <EmptyState v-else-if="!visits.length" icon="mdi-car-outline" message="No tienes visitas de vehículos registradas" />
      <VList v-else rounded="lg" border>
        <template v-for="(v, i) in visits" :key="v.id">
          <VListItem>
            <template #prepend>
              <AppAvatar :src="v.vehiclePhotoUrl" icon="mdi-car-outline" size="48" class="mr-3" />
            </template>
            <VListItemTitle class="font-weight-semibold">{{ v.driverName }} · {{ v.vehiclePlate }}</VListItemTitle>
            <VListItemSubtitle>Entrada: {{ fmt(v.entryTime) }}</VListItemSubtitle>
            <VListItemSubtitle v-if="v.exitTime">Salida: {{ fmt(v.exitTime) }} · {{ v.duration }} min</VListItemSubtitle>
          </VListItem>
          <VDivider v-if="i < visits.length - 1" />
        </template>
      </VList>
    </VContainer>
  </div>
</template>
