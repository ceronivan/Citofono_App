<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useRouter } from 'vue-router'
import { useStorage } from '@/composables/useStorage'

const authStore = useAuthStore()
const router = useRouter()
const { uploadFile } = useStorage()

const user = authStore.userData!
const loading = ref(false)
const photo = ref<File | null>(null)
const photoPreview = ref(user.photoUrl ?? '')

const form = ref({
  firstName: user.firstName,
  lastName: user.lastName,
  phone: user.phone,
  bloodType: user.bloodType ?? '',
  emergencyName: user.emergencyContact?.name ?? '',
  emergencyPhone: user.emergencyContact?.phone ?? '',
  emergencyRelationship: user.emergencyContact?.relationship ?? '',
})

const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

function onPhotoChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  photo.value = file
  photoPreview.value = URL.createObjectURL(file)
}

async function handleSave() {
  loading.value = true
  try {
    let photoUrl = user.photoUrl
    if (photo.value) {
      photoUrl = await uploadFile(photo.value, `profiles/${user.id}`)
    }
    await authStore.updateProfile({
      firstName: form.value.firstName,
      lastName: form.value.lastName,
      phone: form.value.phone,
      bloodType: form.value.bloodType,
      photoUrl,
      emergencyContact: {
        name: form.value.emergencyName,
        phone: form.value.emergencyPhone,
        relationship: form.value.emergencyRelationship,
      },
    })
    router.push('/profile')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <ScreenHeader title="Editar Información" />

    <VContainer class="py-4">
      <!-- Photo -->
      <div class="d-flex flex-column align-center mb-6">
        <div class="position-relative">
          <AppAvatar :src="photoPreview" size="100" />
          <label for="profile-photo" class="photo-btn">
            <VIcon size="18" color="white">mdi-camera</VIcon>
          </label>
          <input id="profile-photo" type="file" accept="image/*" class="d-none" @change="onPhotoChange" />
        </div>
      </div>

      <VTextField v-model="form.firstName" label="Nombre" class="mb-3" />
      <VTextField v-model="form.lastName" label="Apellido" class="mb-3" />
      <VTextField v-model="form.phone" label="Celular" type="tel" class="mb-3" />
      <VSelect v-model="form.bloodType" label="Tipo de sangre (RH)" :items="bloodTypes" class="mb-5" />

      <p class="text-subtitle-2 font-weight-semibold mb-3">Contacto de emergencia</p>
      <VTextField v-model="form.emergencyName" label="Nombre" class="mb-3" />
      <VTextField v-model="form.emergencyPhone" label="Celular" type="tel" class="mb-3" />
      <VTextField v-model="form.emergencyRelationship" label="Parentesco" class="mb-5" />

      <div class="d-flex gap-3">
        <BtnSecondary @click="router.back()">Cancelar</BtnSecondary>
        <BtnPrimary :loading="loading" @click="handleSave">Guardar</BtnPrimary>
      </div>
    </VContainer>
  </div>
</template>

<style scoped>
.photo-btn {
  position: absolute; bottom: 0; right: 0;
  background: var(--color-primary); border-radius: 50%;
  width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center; cursor: pointer;
}
</style>
