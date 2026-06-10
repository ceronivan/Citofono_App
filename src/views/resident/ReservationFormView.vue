<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useReservationsStore } from '@/stores/reservations.store'
import { useAuthStore } from '@/stores/auth.store'
import { useComplexStore } from '@/stores/complex.store'
import { Timestamp } from 'firebase/firestore'
import type { CommonArea } from '@/types'

const router = useRouter()
const store = useReservationsStore()
const authStore = useAuthStore()
const complexStore = useComplexStore()
const loading = ref(false)

const form = ref({
  title: '',
  responsibleName: authStore.userData ? `${authStore.userData.firstName} ${authStore.userData.lastName}` : '',
  amenityId: '',
  startDateTime: '',
  endDateTime: '',
})

onMounted(async () => {
  await Promise.allSettled([complexStore.fetchCurrent(), complexStore.fetchUnits()])
})

// Fallback a las zonas fijas v1 si el edificio no tiene amenidades configuradas
const FALLBACK = [
  { id: 'pool', name: 'Piscina', icon: 'mdi-pool', requiresApproval: true, blockIfDelinquent: true, active: true },
  { id: 'social_room', name: 'Salón Social', icon: 'mdi-party-popper', requiresApproval: true, blockIfDelinquent: true, active: true },
  { id: 'court', name: 'Cancha', icon: 'mdi-basketball', requiresApproval: true, blockIfDelinquent: true, active: true },
  { id: 'bbq', name: 'BBQ', icon: 'mdi-grill-outline', requiresApproval: true, blockIfDelinquent: true, active: true },
  { id: 'gym', name: 'Gimnasio', icon: 'mdi-dumbbell', requiresApproval: false, blockIfDelinquent: true, active: true },
]

const amenities = computed(() =>
  complexStore.activeAmenities.length ? complexStore.activeAmenities : FALLBACK,
)

const selectedAmenity = computed(() =>
  amenities.value.find((a) => a.id === form.value.amenityId) ?? null,
)

const isDelinquent = computed(() => complexStore.myUnit?.feeStatus === 'delinquent')

/** Bloqueo por mora: solo aplica a amenidades configuradas con blockIfDelinquent. */
const blockedByFee = computed(
  () => isDelinquent.value && !!selectedAmenity.value?.blockIfDelinquent,
)

const canSave = computed(
  () =>
    form.value.title.trim() &&
    form.value.responsibleName.trim() &&
    form.value.amenityId &&
    form.value.startDateTime &&
    form.value.endDateTime &&
    !blockedByFee.value,
)

async function handleSave() {
  if (!canSave.value) return
  loading.value = true
  try {
    const amenity = selectedAmenity.value!
    await store.add({
      residentId: authStore.userData!.id,
      apartmentNumber: authStore.apartmentNumber!,
      title: form.value.title,
      responsibleName: form.value.responsibleName,
      // commonArea se mantiene por compatibilidad con datos v1
      commonArea: (['pool', 'social_room', 'court', 'bbq', 'gym'].includes(amenity.id)
        ? amenity.id
        : 'other') as CommonArea,
      amenityId: amenity.id,
      amenityName: amenity.name,
      startDateTime: Timestamp.fromDate(new Date(form.value.startDateTime)),
      endDateTime: Timestamp.fromDate(new Date(form.value.endDateTime)),
      status: amenity.requiresApproval ? 'pending' : 'approved',
    })
    router.push('/reservations')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <ScreenHeader title="Nueva Reserva" />
    <VContainer class="py-4">
      <!-- Selector visual de amenidad -->
      <p class="amenity-label">Zona común</p>
      <div class="amenity-picker">
        <button
          v-for="a in amenities"
          :key="a.id"
          class="amenity-opt"
          :class="{
            'amenity-opt--on': form.amenityId === a.id,
            'amenity-opt--blocked': isDelinquent && a.blockIfDelinquent,
          }"
          @click="form.amenityId = a.id"
        >
          <VIcon :icon="a.icon" size="22" />
          <span>{{ a.name }}</span>
          <VIcon
            v-if="isDelinquent && a.blockIfDelinquent"
            icon="mdi-lock-outline"
            size="13"
            class="amenity-lock"
          />
        </button>
      </div>

      <!-- Aviso de mora -->
      <Transition name="fee-warn">
        <div v-if="blockedByFee" class="fee-warning" role="alert">
          <VIcon icon="mdi-lock-alert-outline" size="20" />
          <div>
            <strong>Reserva no disponible</strong>
            <p>
              Tu apartamento registra mora en la cuota de administración.
              Ponte al día con la administración para reservar esta zona.
            </p>
          </div>
        </div>
      </Transition>

      <div v-if="selectedAmenity && !selectedAmenity.requiresApproval && !blockedByFee" class="auto-approve-note">
        <VIcon icon="mdi-flash-outline" size="14" />
        Esta zona se reserva sin aprobación del administrador
      </div>

      <VTextField v-model="form.title" label="Título" placeholder="Cumpleaños de Sara" class="mb-3" />
      <VTextField v-model="form.responsibleName" label="Responsable" class="mb-3" />
      <VTextField v-model="form.startDateTime" label="Desde" type="datetime-local" class="mb-3" />
      <VTextField v-model="form.endDateTime" label="Hasta" type="datetime-local" class="mb-5" />
      <div class="d-flex gap-3">
        <BtnSecondary @click="router.back()">Cancelar</BtnSecondary>
        <BtnPrimary :loading="loading" :disabled="!canSave" @click="handleSave">Guardar</BtnPrimary>
      </div>
    </VContainer>
  </div>
</template>

<style scoped>
.amenity-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin: 0 0 8px;
}

.amenity-picker {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}

.amenity-opt {
  position: relative;
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 12px 6px;
  background: var(--color-surface);
  border: 1.5px solid transparent;
  border-radius: 14px;
  cursor: pointer;
  font-size: 11.5px; font-weight: 600;
  color: var(--color-text-secondary);
  box-shadow: var(--shadow-xs);
  transition: all 0.15s ease;
  font-family: inherit;
}
.amenity-opt:active { transform: scale(0.94); }
.amenity-opt--on {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-primary-10);
}
.amenity-opt--blocked { opacity: 0.7; }
.amenity-lock {
  position: absolute; top: 6px; right: 6px;
  color: var(--color-error);
}

.fee-warning {
  display: flex; gap: 12px;
  background: var(--color-error-soft);
  color: #B91C1C;
  border-radius: 16px;
  padding: 14px 16px;
  margin-bottom: 16px;
}
.fee-warning strong { font-size: 13.5px; font-weight: 700; }
.fee-warning p { font-size: 12.5px; margin: 2px 0 0; line-height: 1.45; }

.fee-warn-enter-active { transition: all 0.25s ease; }
.fee-warn-enter-from { opacity: 0; transform: translateY(-8px); }
.fee-warn-leave-active { transition: all 0.2s ease; }
.fee-warn-leave-to { opacity: 0; }

.auto-approve-note {
  display: flex; align-items: center; gap: 5px;
  font-size: 12px; font-weight: 500;
  color: var(--color-success);
  background: var(--color-success-soft);
  border-radius: 10px;
  padding: 8px 12px;
  margin-bottom: 16px;
}
</style>
