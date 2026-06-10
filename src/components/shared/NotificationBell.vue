<script setup lang="ts">
import { useNotificationsStore } from '@/stores/notifications.store'
const notifStore = useNotificationsStore()
</script>

<template>
  <RouterLink to="/notifications" class="notif-btn" aria-label="Notificaciones">
    <VBadge
      :content="notifStore.unreadCount"
      :model-value="notifStore.unreadCount > 0"
      color="error"
      floating
    >
      <div class="notif-icon-wrap">
        <VIcon icon="mdi-bell-outline" size="20" />
      </div>
    </VBadge>
  </RouterLink>
</template>

<style scoped>
.notif-btn {
  text-decoration: none;
  display: flex;
  align-items: center;
}

.notif-icon-wrap {
  width: 36px;
  height: 36px;
  background: var(--color-surface-2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-primary);
  transition: background 0.15s ease;
}

.notif-icon-wrap:active {
  background: var(--color-border);
}
</style>
