<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth.store'

const authStore = useAuthStore()
const email = ref('')
const loading = ref(false)
const sent = ref(false)
const error = ref('')

async function handleReset() {
  error.value = ''
  loading.value = true
  try {
    await authStore.resetPassword(email.value.trim())
    sent.value = true
  } catch {
    error.value = 'No se pudo enviar el correo. Verifica la dirección ingresada.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <VContainer class="fill-height pa-6" style="max-width: 420px; min-height: 100vh;">
    <VRow align="center" class="fill-height">
      <VCol cols="12">
        <ScreenHeader title="Recuperar contraseña" />

        <div class="mt-6">
          <VAlert v-if="sent" type="success" variant="tonal" class="mb-5">
            Revisa tu correo para restablecer tu contraseña.
          </VAlert>

          <VAlert v-if="error" type="error" variant="tonal" closable class="mb-5" @click:close="error = ''">
            {{ error }}
          </VAlert>

          <p class="text-body-2 text-medium-emphasis mb-5">
            Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
          </p>

          <VForm v-if="!sent" @submit.prevent="handleReset">
            <VTextField
              v-model="email"
              label="Correo electrónico"
              type="email"
              prepend-inner-icon="mdi-email-outline"
              class="mb-4"
              :disabled="loading"
            />
            <BtnPrimary :loading="loading" icon="mdi-send-outline">
              Enviar enlace
            </BtnPrimary>
          </VForm>
        </div>
      </VCol>
    </VRow>
  </VContainer>
</template>
