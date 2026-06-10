<script setup lang="ts">
import { ref } from 'vue'
import { useVisitsStore } from '@/stores/visits.store'
import type { VisitType } from '@/types'

const store = useVisitsStore()
const loading = ref(false)
const success = ref(false)
const visitType = ref<VisitType>('pedestrian')
const photo = ref<File | null>(null)

const form = ref({
  apartmentNumber: '',
  visitorName: '',
  visitorIdNumber: '',
  driverName: '',
  vehiclePlate: '',
  residentId: '',
  notes: '',
})

function onPhotoChange(e: Event) {
  photo.value = (e.target as HTMLInputElement).files?.[0] ?? null
}

async function handleRegister() {
  loading.value = true
  try {
    const data = visitType.value === 'pedestrian'
      ? { apartmentNumber: form.value.apartmentNumber, visitorName: form.value.visitorName, visitorIdNumber: form.value.visitorIdNumber, residentId: form.value.residentId }
      : { apartmentNumber: form.value.apartmentNumber, driverName: form.value.driverName, vehiclePlate: form.value.vehiclePlate.toUpperCase(), residentId: form.value.residentId }

    await store.register(visitType.value, data, photo.value ?? undefined)
    success.value = true
    form.value = { apartmentNumber: '', visitorName: '', visitorIdNumber: '', driverName: '', vehiclePlate: '', residentId: '', notes: '' }
    photo.value = null
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <ScreenHeader title="Registrar Visita" />
    <VContainer class="py-4">
      <VAlert v-if="success" type="success" variant="tonal" closable class="mb-4" @click:close="success = false">
        Visita registrada exitosamente
      </VAlert>

      <VBtnToggle v-model="visitType" mandatory class="mb-5 w-100" color="success" rounded="lg">
        <VBtn value="pedestrian" class="flex-1-1 text-none">Peatonal</VBtn>
        <VBtn value="vehicle" class="flex-1-1 text-none">Vehículo</VBtn>
      </VBtnToggle>

      <VTextField v-model="form.apartmentNumber" label="Apto destino" class="mb-3" />

      <template v-if="visitType === 'pedestrian'">
        <VTextField v-model="form.visitorName" label="Nombre del visitante" class="mb-3" />
        <VTextField v-model="form.visitorIdNumber" label="Cédula (opcional)" type="number" class="mb-3" />
      </template>
      <template v-else>
        <VTextField v-model="form.driverName" label="Nombre del conductor" class="mb-3" />
        <VTextField v-model="form.vehiclePlate" label="Placa" class="mb-3" @input="form.vehiclePlate = form.vehiclePlate.toUpperCase()" />
      </template>

      <!-- Photo capture -->
      <VBtn variant="tonal" color="success" prepend-icon="mdi-camera" class="mb-4 text-none" @click="($refs.visitPhoto as HTMLElement).click()">
        {{ photo ? 'Foto capturada ✓' : 'Tomar foto' }}
      </VBtn>
      <input ref="visitPhoto" type="file" accept="image/*" capture="environment" class="d-none" @change="onPhotoChange" />

      <BtnPrimary :loading="loading" icon="mdi-check" style="background: #10B981;" @click="handleRegister">
        Registrar Visita
      </BtnPrimary>
    </VContainer>
  </div>
</template>
