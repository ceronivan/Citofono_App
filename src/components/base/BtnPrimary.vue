<script setup lang="ts">
defineProps<{
  icon?: string
  loading?: boolean
  disabled?: boolean
  size?: string
}>()
</script>

<template>
  <VBtn
    color="primary"
    block
    :prepend-icon="icon"
    :loading="loading"
    :disabled="disabled"
    :size="size ?? 'large'"
    rounded="pill"
    class="font-weight-semibold"
    style="text-transform: none; letter-spacing: 0; min-height: 52px;"
  >
    <slot />
  </VBtn>
</template>
