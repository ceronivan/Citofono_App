<script setup lang="ts">
import { useConfirmStore } from '@/stores/confirm.store'

const confirm = useConfirmStore()
</script>

<template>
  <VDialog
    :model-value="confirm.visible"
    max-width="360"
    persistent
    @update:model-value="confirm.answer(false)"
  >
    <VCard rounded="xl" class="pa-5 text-center">
      <div
        class="cd-icon"
        :class="confirm.options.danger ? 'cd-icon--danger' : 'cd-icon--info'"
      >
        <VIcon :icon="confirm.options.icon" size="26" />
      </div>
      <h3 class="cd-title">{{ confirm.options.title }}</h3>
      <p v-if="confirm.options.message" class="cd-message">{{ confirm.options.message }}</p>
      <div class="d-flex gap-3 mt-4">
        <VBtn
          variant="tonal"
          color="default"
          rounded="pill"
          size="large"
          class="text-none flex-grow-1"
          @click="confirm.answer(false)"
        >{{ confirm.options.cancelText }}</VBtn>
        <VBtn
          :color="confirm.options.danger ? 'error' : 'primary'"
          variant="flat"
          rounded="pill"
          size="large"
          class="text-none flex-grow-1"
          @click="confirm.answer(true)"
        >{{ confirm.options.confirmText }}</VBtn>
      </div>
    </VCard>
  </VDialog>
</template>

<style scoped>
.cd-icon {
  width: 56px;
  height: 56px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
}
.cd-icon--danger { background: var(--color-error-soft); color: var(--color-error); }
.cd-icon--info { background: var(--color-primary-soft); color: var(--color-primary); }

.cd-title {
  font-size: 17px;
  font-weight: 800;
  letter-spacing: -0.3px;
  color: var(--color-text-primary);
  margin: 0 0 4px;
}

.cd-message {
  font-size: 13.5px;
  color: var(--color-text-secondary);
  line-height: 1.5;
  margin: 0;
}
</style>
