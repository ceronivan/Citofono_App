<script setup lang="ts">
import { useRouter } from 'vue-router'

withDefaults(
  defineProps<{
    title?: string
    showBack?: boolean
  }>(),
  { showBack: true },
)

const router = useRouter()

function goBack() {
  // Sin historial (deep link / recarga) → al dashboard del rol ('/' redirige según rol)
  if (window.history.state?.back) router.back()
  else router.push('/')
}
</script>

<template>
  <div class="screen-header-bar">
    <div class="header-inner">
      <button
        v-if="showBack !== false"
        class="back-btn"
        aria-label="Atrás"
        @click="goBack"
      >
        <VIcon icon="mdi-arrow-left" size="20" />
      </button>
      <div v-else class="back-btn-placeholder" />

      <h1 v-if="title" class="header-title">{{ title }}</h1>

      <div class="header-actions">
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.screen-header-bar {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--color-bg);
  padding-top: env(safe-area-inset-top, 0);
}

.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 52px;
  padding: 0 16px;
}

.back-btn {
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
  transition: background 0.15s ease;
}
.back-btn:active { background: var(--color-border); }

.back-btn-placeholder {
  width: 36px;
  flex-shrink: 0;
}

.header-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--color-text-primary);
  letter-spacing: -0.2px;
  margin: 0;
  text-align: center;
  flex: 1;
  padding: 0 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  min-width: 36px;
  justify-content: flex-end;
}
</style>
