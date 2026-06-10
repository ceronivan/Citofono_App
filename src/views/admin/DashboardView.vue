<script setup lang="ts">
import { useAuthStore } from '@/stores/auth.store'

const authStore = useAuthStore()

const sections = [
  {
    title: 'Mi Edificio',
    subtitle: 'Unidades, cartera, amenidades e invitaciones',
    icon: 'mdi-office-building-outline',
    to: '/admin/building',
    bg: '#E0F2FE', color: '#0EA5E9',
  },
  {
    title: 'Noticias',
    subtitle: 'Publicar y gestionar noticias',
    icon: 'mdi-newspaper-variant-outline',
    to: '/admin/news',
    bg: '#EDE9FF', color: '#4F35E8',
  },
  {
    title: 'Circulares',
    subtitle: 'Publicar documentos circulares',
    icon: 'mdi-file-document-outline',
    to: '/admin/circulars',
    bg: '#E0E7FF', color: '#4338CA',
  },
  {
    title: 'Reservas',
    subtitle: 'Aprobar o rechazar solicitudes',
    icon: 'mdi-calendar-check-outline',
    to: '/admin/reservations',
    bg: '#DCFCE7', color: '#16A34A',
  },
  {
    title: 'PQRs',
    subtitle: 'Gestionar peticiones y quejas',
    icon: 'mdi-message-alert-outline',
    to: '/admin/pqrs',
    bg: '#FEE2E2', color: '#DC2626',
  },
  {
    title: 'Reportes de Daños',
    subtitle: 'Revisar reportes de daños',
    icon: 'mdi-wrench-outline',
    to: '/admin/damage-reports',
    bg: '#FEF3C7', color: '#D97706',
  },
]

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 18) return 'Buenas tardes'
  return 'Buenas noches'
}
</script>

<template>
  <div class="admin-dash">
    <!-- Hero -->
    <div class="admin-hero">
      <p class="admin-greeting">{{ greeting() }},</p>
      <h1 class="admin-name">{{ authStore.userData?.firstName ?? 'Administrador' }}</h1>
      <div class="admin-role-pill">
        <VIcon icon="mdi-shield-crown-outline" size="13" />
        <span>Administración</span>
      </div>
    </div>

    <!-- Menu list -->
    <div class="admin-menu-wrap">
      <RouterLink
        v-for="item in sections"
        :key="item.to"
        :to="item.to"
        class="admin-menu-item"
      >
        <div class="admin-menu-icon" :style="{ background: item.bg }">
          <VIcon :icon="item.icon" size="22" :color="item.color" />
        </div>
        <div class="admin-menu-text">
          <span class="admin-menu-title">{{ item.title }}</span>
          <span class="admin-menu-sub">{{ item.subtitle }}</span>
        </div>
        <VIcon icon="mdi-chevron-right" size="18" color="#A1A1AA" />
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.admin-dash {
  padding: 0 20px 24px;
}

/* Hero */
.admin-hero {
  padding: 20px 0 28px;
}

.admin-greeting {
  font-size: 15px;
  color: var(--color-text-secondary);
  font-weight: 500;
  margin: 0 0 2px;
}

.admin-name {
  font-size: 28px;
  font-weight: 800;
  color: var(--color-text-primary);
  letter-spacing: -0.8px;
  margin: 0 0 12px;
  line-height: 1.1;
}

.admin-role-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: rgba(14, 165, 233, 0.10);
  color: #0EA5E9;
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 600;
}

/* Menu */
.admin-menu-wrap {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.admin-menu-item {
  display: flex;
  align-items: center;
  gap: 14px;
  background: var(--color-surface);
  border-radius: 18px;
  padding: 14px 16px;
  text-decoration: none;
  box-shadow: var(--shadow-xs);
  transition: transform 0.12s ease;
}

.admin-menu-item:active {
  transform: scale(0.98);
}

.admin-menu-icon {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.admin-menu-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.admin-menu-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.admin-menu-sub {
  font-size: 12px;
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
