<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function goBack() {
  // Sin historial (deep link / recarga) → al dashboard del rol ('/' redirige según rol)
  if (window.history.state?.back) router.back()
  else router.push('/')
}
</script>

<template>
  <button class="back-circle" aria-label="Atrás" @click="goBack">
    <VIcon icon="mdi-arrow-left" size="20" />
  </button>
</template>

<style scoped>
.back-circle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: var(--color-surface-2);
  border-radius: 50%;
  cursor: pointer;
  color: var(--color-text-primary);
  flex-shrink: 0;
  transition: background 0.15s ease, transform 0.12s ease;
}
.back-circle:active {
  transform: scale(0.92);
  background: var(--color-border);
}
</style>
