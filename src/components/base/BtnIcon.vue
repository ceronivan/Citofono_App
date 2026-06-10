<script setup lang="ts">
defineProps<{
  icon: string
  color?: 'primary' | 'danger' | 'success'
  size?: number
}>()
</script>

<template>
  <VBtn
    :icon="icon"
    :color="color === 'danger' ? 'error' : (color ?? 'primary')"
    variant="tonal"
    :size="size ?? 36"
    rounded="circle"
  />
</template>
