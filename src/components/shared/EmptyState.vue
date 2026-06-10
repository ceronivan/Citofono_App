<script setup lang="ts">
defineProps<{
  icon?: string
  message?: string
  actionLabel?: string
}>()

const emit = defineEmits<{ action: [] }>()
</script>

<template>
  <div class="d-flex flex-column align-center justify-center py-12 px-6 text-center">
    <VIcon :icon="icon ?? 'mdi-inbox-outline'" size="64" color="grey-lighten-1" class="mb-4" />
    <p class="text-body-1 text-medium-emphasis mb-4">{{ message ?? 'No hay datos disponibles' }}</p>
    <VBtn v-if="actionLabel" color="primary" variant="tonal" class="text-none" @click="emit('action')">
      {{ actionLabel }}
    </VBtn>
  </div>
</template>
