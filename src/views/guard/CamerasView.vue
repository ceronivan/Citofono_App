<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useCamerasStore } from '@/stores/cameras.store'
import CameraGrid from '@/components/shared/CameraGrid.vue'

const store = useCamerasStore()
onMounted(() => store.fetchAll())

const activeCount = computed(() => store.items.filter((c) => c.active).length)
</script>

<template>
  <div>
    <ScreenHeader title="Cámaras" />
    <VContainer class="py-4">
      <div class="gc-status">
        <span class="gc-live-dot" />
        <span><strong>{{ activeCount }}</strong> de {{ store.items.length }} cámaras en línea</span>
      </div>

      <LoadingSpinner v-if="store.loading" />
      <EmptyState v-else-if="!store.items.length" icon="mdi-cctv" message="El administrador aún no configura cámaras" />
      <CameraGrid v-else :cameras="store.items" />
    </VContainer>
  </div>
</template>

<style scoped>
.gc-status {
  display: flex; align-items: center; gap: 8px;
  font-size: 13px; color: var(--color-text-secondary);
  margin-bottom: 14px;
}
.gc-status strong { color: var(--color-text-primary); }

.gc-live-dot {
  width: 9px; height: 9px; border-radius: 50%;
  background: var(--color-guard);
  animation: live-pulse 1.8s ease infinite;
}
@keyframes live-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.35); }
  50% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
}
</style>
