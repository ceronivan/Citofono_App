<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useVehiclesStore } from '@/stores/vehicles.store'
import type { VehicleType } from '@/types'

const router = useRouter()
const route = useRoute()
const store = useVehiclesStore()

const isEdit = computed(() => !!route.params.id)
const loading = ref(false)
const photo = ref<File | null>(null)
const photoPreview = ref('')

const form = ref({
  type: '' as VehicleType,
  brand: '',
  color: '',
  plate: '',
  photoUrl: '',
})

const vehicleTypes = [
  { value: 'car', title: 'Carro' },
  { value: 'motorcycle', title: 'Moto' },
  { value: 'bicycle', title: 'Bicicleta' },
  { value: 'truck', title: 'Camión' },
  { value: 'other', title: 'Otro' },
]

const colors = ['Blanco', 'Negro', 'Gris', 'Plateado', 'Rojo', 'Azul', 'Verde', 'Amarillo', 'Naranja', 'Café', 'Otro']
const brands = ['Toyota', 'Chevrolet', 'Renault', 'Mazda', 'Hyundai', 'Kia', 'Ford', 'Volkswagen', 'Nissan', 'Honda', 'Otro']

onMounted(() => {
  if (isEdit.value) {
    const v = store.items.find(v => v.id === route.params.id)
    if (v) {
      form.value = { type: v.type, brand: v.brand, color: v.color, plate: v.plate, photoUrl: v.photoUrl ?? '' }
      photoPreview.value = v.photoUrl ?? ''
    }
  }
})

function onPhotoChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  photo.value = file
  photoPreview.value = URL.createObjectURL(file)
}

async function handleSave() {
  loading.value = true
  try {
    const { useAuthStore } = await import('@/stores/auth.store')
    const authStore = useAuthStore()
    const payload = {
      ...form.value,
      plate: form.value.plate.toUpperCase(),
      ownerId: authStore.userData!.id,
      apartmentNumber: authStore.userData!.apartmentNumber!,
    }
    if (isEdit.value) {
      await store.update(route.params.id as string, payload, photo.value ?? undefined)
    } else {
      await store.add(payload, photo.value ?? undefined)
    }
    router.push('/vehicles')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <ScreenHeader :title="isEdit ? 'Editar Vehículo' : 'Agregar Vehículo'" />

    <VContainer class="py-4">
      <!-- Photo upload -->
      <div class="d-flex flex-column align-center mb-6">
        <div class="position-relative">
          <AppAvatar :src="photoPreview" icon="mdi-car-outline" size="100" />
          <label for="vehicle-photo" class="photo-btn">
            <VIcon size="18" color="white">mdi-camera</VIcon>
          </label>
          <input id="vehicle-photo" type="file" accept="image/*" class="d-none" @change="onPhotoChange" />
        </div>
        <p class="text-caption text-medium-emphasis mt-2">Foto del vehículo</p>
      </div>

      <!-- Form -->
      <VSelect
        v-model="form.type"
        label="Tipo de Vehículo"
        :items="vehicleTypes"
        item-title="title"
        item-value="value"
        class="mb-3"
      />
      <VSelect v-model="form.brand" label="Marca" :items="brands" class="mb-3" />
      <VSelect v-model="form.color" label="Color" :items="colors" class="mb-3" />
      <VTextField
        v-model="form.plate"
        label="Placa"
        class="mb-5"
        hint="Ej: ABC123"
        :counter="7"
        @input="form.plate = form.plate.toUpperCase()"
      />

      <div class="d-flex gap-3">
        <BtnSecondary @click="router.back()">Cancelar</BtnSecondary>
        <BtnPrimary :loading="loading" @click="handleSave">Guardar</BtnPrimary>
      </div>
    </VContainer>
  </div>
</template>

<style scoped>
.photo-btn {
  position: absolute;
  bottom: 0;
  right: 0;
  background: var(--color-primary);
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
</style>
