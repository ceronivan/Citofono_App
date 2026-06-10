<script setup lang="ts">
defineProps<{
  src?: string
  size?: number | string
  icon?: string
  alt?: string
}>()
</script>

<template>
  <VAvatar :size="size ?? 64" color="grey-lighten-3">
    <VImg v-if="src" :src="src" :alt="alt ?? 'Avatar'" cover />
    <VIcon v-else :icon="icon ?? 'mdi-account-outline'" color="grey" />
  </VAvatar>
</template>
