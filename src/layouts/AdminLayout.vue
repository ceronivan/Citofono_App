<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useConfirmStore } from '@/stores/confirm.store'

const route = useRoute()
const authStore = useAuthStore()
const confirm = useConfirmStore()

async function handleLogout() {
  const ok = await confirm.ask({
    title: '¿Cerrar sesión?',
    message: 'Volverás a la pantalla de inicio de sesión.',
    confirmText: 'Salir',
    danger: false,
    icon: 'mdi-logout-variant',
  })
  if (ok) await authStore.logout()
}

const navItems = [
  { icon: 'mdi-view-dashboard-outline',     iconActive: 'mdi-view-dashboard',       label: 'Inicio',   to: '/admin' },
  { icon: 'mdi-office-building-outline',    iconActive: 'mdi-office-building',      label: 'Edificio', to: '/admin/building' },
  { icon: 'mdi-calendar-check-outline',     iconActive: 'mdi-calendar-check',       label: 'Reservas', to: '/admin/reservations' },
  { icon: 'mdi-message-alert-outline',      iconActive: 'mdi-message-alert',        label: 'PQRs',     to: '/admin/pqrs' },
  { icon: 'mdi-newspaper-variant-outline',  iconActive: 'mdi-newspaper-variant',    label: 'Noticias', to: '/admin/news' },
]

function isActive(item: typeof navItems[0]) {
  if (item.to === '/admin') return route.path === '/admin'
  return route.path.startsWith(item.to)
}
</script>

<template>
  <div class="admin-shell">
    <!-- Top header -->
    <header class="admin-header">
      <div class="admin-header-inner">
        <div class="admin-brand">
          <BuildingSwitcher />
          <VChip size="x-small" color="info" variant="flat" class="ml-1">Admin</VChip>
        </div>
        <button class="logout-btn" @click="handleLogout" aria-label="Cerrar sesión">
          <VIcon icon="mdi-logout-variant" size="20" />
        </button>
      </div>
    </header>

    <main class="admin-main page-content">
      <RouterView v-slot="{ Component }">
        <Transition name="page">
          <component :is="Component" :key="route.path" />
        </Transition>
      </RouterView>
    </main>

    <!-- Floating bottom navigation -->
    <nav class="bottom-nav-wrap" aria-label="Navegación admin">
      <div class="bottom-nav bottom-nav--admin">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="nav-item"
          :class="{ 'nav-item--active': isActive(item) }"
          :aria-current="isActive(item) ? 'page' : undefined"
        >
          <div class="nav-icon-wrap">
            <VIcon
              :icon="isActive(item) ? item.iconActive : item.icon"
              size="22"
            />
          </div>
          <span class="nav-label">{{ item.label }}</span>
        </RouterLink>
      </div>
    </nav>
  </div>
</template>

<style scoped>
.admin-shell {
  position: relative;
  min-height: 100dvh;
  background: var(--color-bg);
}

/* Header */
.admin-header {
  position: sticky;
  top: 0;
  z-index: 20;
  background: rgba(248, 248, 252, 0.92);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--color-border-light);
  padding-top: env(safe-area-inset-top, 0);
}

.admin-header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 20px;
}

.admin-brand {
  display: flex;
  align-items: center;
  gap: 8px;
}

.admin-brand-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-admin);
}

.admin-brand-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.3px;
}

.logout-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: var(--color-surface-2);
  border-radius: 50%;
  cursor: pointer;
  color: var(--color-text-secondary);
  transition: background 0.15s ease, color 0.15s ease;
}
.logout-btn:active {
  background: var(--color-border);
  color: var(--color-error);
}

.admin-main {
  min-height: 100dvh;
}

/* Floating nav */
.bottom-nav-wrap {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 480px;
  padding: 8px 16px max(16px, env(safe-area-inset-bottom, 16px));
  z-index: 100;
  pointer-events: none;
}

.bottom-nav {
  display: flex;
  align-items: center;
  justify-content: space-around;
  background: rgba(255, 255, 255, 0.90);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border-radius: 26px;
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.09),
    0 0 0 1px rgba(0, 0, 0, 0.04);
  padding: 6px 8px;
  pointer-events: all;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 6px 10px;
  border-radius: 20px;
  text-decoration: none;
  color: var(--color-text-tertiary);
  transition: color 0.2s ease;
  flex: 1;
  min-width: 0;
}

.nav-icon-wrap {
  width: 38px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  transition: background 0.2s ease;
}

.nav-item--active {
  color: var(--color-admin);
}

.nav-item--active .nav-icon-wrap {
  background: rgba(14, 165, 233, 0.08);
}

.nav-label {
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0;
  line-height: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

/* Page transitions live in global.css */
</style>
