<script setup lang="ts">
import { onMounted } from 'vue'
import { useReservationsStore } from '@/stores/reservations.store'
import dayjs from 'dayjs'

const store = useReservationsStore()
onMounted(() => store.fetchMine())

const AREAS: Record<string, string> = {
  pool: 'Piscina', social_room: 'Salón Social', court: 'Cancha',
  bbq: 'BBQ', gym: 'Gimnasio', other: 'Otro',
}
const fmt = (ts: any) => ts?.toDate ? dayjs(ts.toDate()).format('DD/MM HH:mm') : '—'
</script>

<template>
  <div>
    <ScreenHeader title="Mis Reservas" />
    <VContainer class="py-4">
      <BtnPrimary icon="mdi-plus" class="mb-4" to="/reservations/new">Crear nueva reserva</BtnPrimary>
      <LoadingSpinner v-if="store.loading" />
      <EmptyState v-else-if="!store.items.length" icon="mdi-calendar-outline" message="No tienes reservas" />
      <VList v-else rounded="lg" border>
        <template v-for="(r, i) in store.items" :key="r.id">
          <VListItem :to="`/reservations/${r.id}`" nav>
            <VListItemTitle class="font-weight-semibold">{{ r.title }}</VListItemTitle>
            <VListItemSubtitle>{{ AREAS[r.commonArea] }} · {{ fmt(r.startDateTime) }} → {{ fmt(r.endDateTime) }}</VListItemSubtitle>
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
