<script setup lang="ts">
import { onMounted } from 'vue'
import { useReservationsStore } from '@/stores/reservations.store'
import dayjs from 'dayjs'

const store = useReservationsStore()
onMounted(() => store.fetchAll())

const AREAS: Record<string, string> = { pool: 'Piscina', social_room: 'Salón Social', court: 'Cancha', bbq: 'BBQ', gym: 'Gimnasio', other: 'Otro' }
const fmt = (ts: any) => ts?.toDate ? dayjs(ts.toDate()).format('DD/MM HH:mm') : '—'
</script>

<template>
  <div>
    <ScreenHeader title="Gestión de Reservas" />
    <VContainer class="py-4">
      <LoadingSpinner v-if="store.loading" />
      <EmptyState v-else-if="!store.items.length" icon="mdi-calendar-outline" message="No hay reservas" />
      <VList v-else rounded="lg" border>
        <template v-for="(r, i) in store.items" :key="r.id">
          <VListItem>
            <VListItemTitle class="font-weight-semibold">{{ r.title }} · Apto {{ r.apartmentNumber }}</VListItemTitle>
            <VListItemSubtitle>{{ AREAS[r.commonArea] }} · {{ fmt(r.startDateTime) }} → {{ fmt(r.endDateTime) }}</VListItemSubtitle>
            <template #append>
              <div class="d-flex flex-column align-end gap-1">
                <StatusBadge :status="r.status" />
                <div v-if="r.status === 'pending'" class="d-flex gap-1 mt-1">
                  <VBtn size="x-small" color="success" variant="tonal" class="text-none" @click="store.updateStatus(r.id, 'approved')">Aprobar</VBtn>
                  <VBtn size="x-small" color="error" variant="tonal" class="text-none" @click="store.updateStatus(r.id, 'rejected')">Rechazar</VBtn>
                </div>
              </div>
            </template>
          </VListItem>
          <VDivider v-if="i < store.items.length - 1" />
        </template>
      </VList>
    </VContainer>
  </div>
</template>
