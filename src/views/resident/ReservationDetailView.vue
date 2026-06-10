<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useReservationsStore } from '@/stores/reservations.store'
import dayjs from 'dayjs'

const route = useRoute()
const store = useReservationsStore()
const r = computed(() => store.items.find(x => x.id === route.params.id))
const fmt = (ts: any) => ts?.toDate ? dayjs(ts.toDate()).format('DD/MM/YYYY HH:mm') : '—'
const AREAS: Record<string, string> = { pool: 'Piscina', social_room: 'Salón Social', court: 'Cancha', bbq: 'BBQ', gym: 'Gimnasio', other: 'Otro' }
</script>

<template>
  <div>
    <ScreenHeader title="Reserva">
      <template v-if="r" #actions>
        <StatusBadge :status="r.status" class="mr-2" />
      </template>
    </ScreenHeader>
    <EmptyState v-if="!r" icon="mdi-calendar-outline" message="Reserva no encontrada" />
    <VContainer v-else class="py-4">
      <VList rounded="lg" border lines="two">
        <VListItem title="Título" :subtitle="r.title" />
        <VDivider />
        <VListItem title="Zona" :subtitle="AREAS[r.commonArea]" />
        <VDivider />
        <VListItem title="Responsable" :subtitle="r.responsibleName" />
        <VDivider />
        <VListItem title="Desde" :subtitle="fmt(r.startDateTime)" />
        <VDivider />
        <VListItem title="Hasta" :subtitle="fmt(r.endDateTime)" />
      </VList>
      <VAlert v-if="r.adminNotes" type="info" variant="tonal" class="mt-4">{{ r.adminNotes }}</VAlert>
    </VContainer>
  </div>
</template>
