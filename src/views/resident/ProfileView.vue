<script setup lang="ts">
import { useAuthStore } from '@/stores/auth.store'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()
const user = authStore.userData!

const fields = [
  { label: 'Nombre',       value: user.firstName },
  { label: 'Apellido',     value: user.lastName },
  { label: 'Apto',         value: user.apartmentNumber },
  { label: 'Cédula',       value: user.idNumber },
  { label: 'Celular',      value: user.phone },
  { label: 'Correo',       value: user.email },
  { label: 'RH',           value: user.bloodType },
  { label: 'Contacto emergencia', value: user.emergencyContact?.name },
  { label: 'Celular emergencia',  value: user.emergencyContact?.phone },
  { label: 'Parentesco',   value: user.emergencyContact?.relationship },
]
</script>

<template>
  <div>
    <ScreenHeader title="Mi Información">
      <template #actions>
        <VBtn icon variant="text" @click="router.push('/profile/edit')">
          <VIcon>mdi-pencil</VIcon>
        </VBtn>
      </template>
    </ScreenHeader>

    <VContainer class="py-4">
      <!-- Avatar -->
      <div class="d-flex flex-column align-center mb-6">
        <AppAvatar :src="user.photoUrl" size="100" />
      </div>

      <!-- Fields -->
      <VList lines="two" rounded="lg" border>
        <template v-for="(field, i) in fields.filter(f => f.value)" :key="field.label">
          <VListItem :subtitle="field.label" :title="field.value ?? '—'" />
          <VDivider v-if="i < fields.length - 1" />
        </template>
      </VList>

      <!-- Document image -->
      <div v-if="user.idDocumentUrl" class="mt-4">
        <p class="text-caption text-medium-emphasis mb-2">Documento de identidad</p>
        <VImg
          :src="user.idDocumentUrl"
          rounded="lg"
          cover
          height="180"
          style="border: 2px solid var(--color-primary);"
        />
      </div>

      <!-- Logout -->
      <VBtn
        variant="tonal"
        color="error"
        block
        class="mt-6 text-none font-weight-semibold"
        prepend-icon="mdi-logout"
        @click="authStore.logout()"
      >
        Cerrar sesión
      </VBtn>
    </VContainer>
  </div>
</template>
