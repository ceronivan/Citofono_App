<script setup lang="ts">
defineProps<{
  icon?: string
  loading?: boolean
  disabled?: boolean
}>()
</script>

<template>
  <VBtn
    variant="tonal"
    color="primary"
    block
    :prepend-icon="icon"
    :loading="loading"
    :disabled="disabled"
    rounded="pill"
    class="font-weight-semibold"
    style="text-transform: none; letter-spacing: 0; min-height: 52px;"
  >
    <slot />
  </VBtn>
</template>
