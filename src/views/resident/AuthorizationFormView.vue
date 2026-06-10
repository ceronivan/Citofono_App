<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthorizationsStore } from '@/stores/authorizations.store'
import { useAuthStore } from '@/stores/auth.store'
import { Timestamp } from 'firebase/firestore'

const router = useRouter()
const route = useRoute()
const store = useAuthorizationsStore()
const authStore = useAuthStore()

const isEdit = computed(() => !!route.params.id)
const loading = ref(false)
const photo = ref<File | null>(null)
const photoPreview = ref('')

const form = ref({
  firstName: '', lastName: '', idNumber: '',
  validFrom: '', validUntil: '',
  apartmentNumber: authStore.userData?.apartmentNumber ?? '',
})

onMounted(() => {
  if (isEdit.value) {
    const a = store.items.find(a => a.id === route.params.id)
    if (a) {
      form.value.firstName = a.person.firstName
      form.value.lastName = a.person.lastName
      form.value.idNumber = a.person.idNumber
      photoPreview.value = a.person.photoUrl ?? ''
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
    const payload = {
      grantedBy: authStore.userData!.id,
      apartmentNumber: form.value.apartmentNumber,
      person: {
        firstName: form.value.firstName,
        lastName: form.value.lastName,
        idNumber: form.value.idNumber,
        photoUrl: photoPreview.value,
      },
      validFrom: Timestamp.fromDate(new Date(form.value.validFrom)),
      validUntil: Timestamp.fromDate(new Date(form.value.validUntil)),
      isActive: true,
    }
    if (isEdit.value) {
      await store.update(route.params.id as string, payload, photo.value ?? undefined)
    } else {
      await store.add(payload, photo.value ?? undefined)
    }
    router.push('/authorizations')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <ScreenHeader :title="isEdit ? 'Editar Autorización' : 'Agregar Autorización'" />
    <VContainer class="py-4">
      <div class="d-flex flex-column align-center mb-6">
        <div class="position-relative">
          <AppAvatar :src="photoPreview" icon="mdi-account-outline" size="100" />
          <label for="auth-photo" class="photo-btn">
            <VIcon size="18" color="white">mdi-camera</VIcon>
          </label>
          <input id="auth-photo" type="file" accept="image/*" class="d-none" @change="onPhotoChange" />
        </div>
      </div>

      <VTextField v-model="form.firstName" label="Nombre" class="mb-3" />
      <VTextField v-model="form.lastName" label="Apellido" class="mb-3" />
      <VTextField v-model="form.idNumber" label="Cédula" type="number" class="mb-3" />
      <VTextField v-model="form.apartmentNumber" label="Apto de acceso" class="mb-3" />
      <VTextField v-model="form.validFrom" label="Válido desde" type="date" class="mb-3" />
      <VTextField v-model="form.validUntil" label="Válido hasta" type="date" class="mb-5" />

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
