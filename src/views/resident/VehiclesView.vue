<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useVehiclesStore } from '@/stores/vehicles.store'
import { useConfirmStore } from '@/stores/confirm.store'
import type { Vehicle } from '@/types'

const store = useVehiclesStore()
const confirm = useConfirmStore()
const deleting = ref<string | null>(null)

const VEHICLE_LABELS: Record<string, string> = {
  car: 'Carro', motorcycle: 'Moto', bicycle: 'Bicicleta', truck: 'Camión', other: 'Otro',
}

onMounted(() => store.fetchMine())

async function handleDelete(v: Vehicle) {
  const ok = await confirm.ask({
    title: '¿Eliminar vehículo?',
    message: `${VEHICLE_LABELS[v.type]} ${v.brand} · placa ${v.plate}. Esta acción no se puede deshacer.`,
  })
  if (!ok) return
  deleting.value = v.id
  try {
    await store.remove(v.id)
  } finally {
    deleting.value = null
  }
}
</script>

<template>
  <div>
    <ScreenHeader title="Mis Vehículos" />

    <VContainer class="py-4">
      <BtnPrimary icon="mdi-plus" class="mb-4" to="/vehicles/new">
        Agregar Vehículo
      </BtnPrimary>

      <LoadingSpinner v-if="store.loading" />

      <EmptyState
        v-else-if="!store.items.length"
        icon="mdi-car-outline"
        message="No tienes vehículos registrados"
        action-label="Agregar vehículo"
        @action="$router.push('/vehicles/new')"
      />

      <VList v-else rounded="lg" border lines="two">
        <template v-for="(v, i) in store.items" :key="v.id">
          <VListItem>
            <template #prepend>
              <AppAvatar :src="v.photoUrl" icon="mdi-car-outline" size="52" class="mr-3" />
            </template>

            <VListItemTitle class="font-weight-semibold">
              {{ v.brand }} · {{ v.plate }}
            </VListItemTitle>
            <VListItemSubtitle>
              {{ VEHICLE_LABELS[v.type] }} · {{ v.color }}
            </VListItemSubtitle>

            <template #append>
              <div class="d-flex gap-1">
                <BtnIcon icon="mdi-pencil" color="primary" :size="32" @click="$router.push(`/vehicles/${v.id}/edit`)" />
                <BtnIcon
                  icon="mdi-delete"
                  color="danger"
                  :size="32"
                  :loading="deleting === v.id"
                  @click="handleDelete(v)"
                />
              </div>
            </template>
          </VListItem>
          <VDivider v-if="i < store.items.length - 1" />
        </template>
      </VList>
    </VContainer>
  </div>
</template>
