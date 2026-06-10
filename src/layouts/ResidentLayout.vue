<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useMailStore } from '@/stores/mail.store'
import { useNotificationsStore } from '@/stores/notifications.store'

const route = useRoute()
const mailStore = useMailStore()
const notifStore = useNotificationsStore()

const navItems = [
  { icon: 'mdi-home-variant',              iconActive: 'mdi-home-variant',       label: 'Inicio',   to: '/' },
  { icon: 'mdi-newspaper-variant-outline', iconActive: 'mdi-newspaper-variant',  label: 'Noticias', to: '/news' },
  { icon: 'mdi-bell-outline',              iconActive: 'mdi-bell',               label: 'Avisos',   to: '/notifications' },
  { icon: 'mdi-calendar-outline',          iconActive: 'mdi-calendar',           label: 'Reservas', to: '/reservations' },
  { icon: 'mdi-account-circle-outline',    iconActive: 'mdi-account-circle',     label: 'Perfil',   to: '/profile' },
]

const quickActions = [
  { icon: 'mdi-package-variant-closed', label: 'Mi correo',  to: '/mail',           badgeKey: 'mail' },
  { icon: 'mdi-message-alert-outline',  label: 'PQR',        to: '/pqrs',           badgeKey: null },
  { icon: 'mdi-wrench-outline',         label: 'Reportar',   to: '/damage-reports', badgeKey: null },
]

const pendingMail = computed(() =>
  mailStore.items.filter(m => m.status === 'pending' || m.status === 'delivered').length,
)

const notifBadge = computed(() => notifStore.unreadCount || null)

function badge(key: string | null) {
  if (key === 'mail') return pendingMail.value || null
  return null
}

function isActive(item: typeof navItems[0]) {
  if (item.to === '/') return route.path === '/'
  return route.path.startsWith(item.to)
}
</script>

<template>
  <div class="resident-shell">
    <main class="resident-main">
      <RouterView v-slot="{ Component }">
        <Transition name="page">
          <component :is="Component" :key="route.path" />
        </Transition>
      </RouterView>
    </main>

    <!-- Fixed nav area -->
    <div class="nav-area">
      <!-- Quick actions strip (Satispay-style) -->
      <div class="quick-strip">
        <RouterLink
          v-for="qa in quickActions"
          :key="qa.to"
          :to="qa.to"
          class="qa-btn"
        >
          <div class="qa-icon">
            <VBadge
              v-if="badge(qa.badgeKey)"
              :content="badge(qa.badgeKey)"
              color="error"
              floating
            >
              <VIcon :icon="qa.icon" size="17" />
            </VBadge>
            <VIcon v-else :icon="qa.icon" size="17" />
          </div>
          <span class="qa-label">{{ qa.label }}</span>
        </RouterLink>
      </div>

      <!-- Tab bar -->
      <nav class="tab-bar" aria-label="Navegación principal">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="tab-item"
          :class="{ 'tab-item--active': isActive(item) }"
          :aria-current="isActive(item) ? 'page' : undefined"
        >
          <div class="tab-icon-wrap">
            <VBadge
              v-if="item.to === '/notifications' && notifBadge"
              :content="notifBadge"
              color="error"
              floating
            >
              <VIcon :icon="isActive(item) ? item.iconActive : item.icon" size="22" />
            </VBadge>
            <VIcon v-else :icon="isActive(item) ? item.iconActive : item.icon" size="22" />
          </div>
          <span class="tab-label">{{ item.label }}</span>
        </RouterLink>
      </nav>
    </div>
  </div>
</template>

<style scoped>
.resident-shell {
  position: relative;
  min-height: 100dvh;
  background: var(--color-bg);
}

/* Main content — padding-bottom accounts for the full nav area height */
.resident-main {
  padding-bottom: 148px;
  min-height: 100dvh;
}

/* ── Nav area (fixed, full-width within .v-application) ── */
.nav-area {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 480px;
  z-index: 100;
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-top: 1px solid var(--color-border-light);
  padding-bottom: max(8px, env(safe-area-inset-bottom, 8px));
}

/* ── Quick actions strip ── */
.quick-strip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 10px 20px 6px;
}

.qa-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  background: var(--color-surface-2);
  border-radius: 9999px;
  padding: 7px 14px 7px 10px;
  text-decoration: none;
  color: var(--color-text-primary);
  font-size: 13px;
  font-weight: 600;
  transition: background 0.12s ease, transform 0.12s ease;
  flex: 1;
  justify-content: center;
}

.qa-btn:active {
  background: var(--color-border);
  transform: scale(0.96);
}

.qa-icon {
  color: var(--color-primary);
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.qa-label {
  white-space: nowrap;
  color: var(--color-text-primary);
}

/* Divider between strips */
.quick-strip + .tab-bar {
  border-top: 1px solid var(--color-border-light);
}

/* ── Tab bar ── */
.tab-bar {
  display: flex;
  align-items: flex-start;
  justify-content: space-around;
  padding: 6px 4px 2px;
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 4px 8px;
  border-radius: 12px;
  text-decoration: none;
  color: var(--color-text-tertiary);
  transition: color 0.18s ease;
  flex: 1;
  min-width: 0;
}

.tab-icon-wrap {
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  padding: 0 6px;
  transition: background 0.18s ease;
}

.tab-item--active {
  color: var(--color-primary);
}

.tab-item--active .tab-icon-wrap {
  background: var(--color-primary-10);
}

.tab-label {
  font-size: 10px;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
}
</style>
