<script setup lang="ts">
import { useAuthStore } from '@/stores/auth.store'

const authStore = useAuthStore()

const actions = [
  {
    title: 'Registrar Visita',
    subtitle: 'Peatonal o vehicular',
    icon: 'mdi-walk',
    to: '/guard/visits/new',
    bg: '#DCFCE7', color: '#16A34A',
  },
  {
    title: 'Registrar Correspondencia',
    subtitle: 'Paquetes, cartas y documentos',
    icon: 'mdi-package-variant-closed',
    to: '/guard/mail/new',
    bg: '#FEF3C7', color: '#D97706',
  },
  {
    title: 'Autorizaciones',
    subtitle: 'Buscar por apto o nombre',
    icon: 'mdi-shield-account-outline',
    to: '/guard/authorizations',
    bg: '#DBEAFE', color: '#2563EB',
  },
  {
    title: 'Verificar Domicilio',
    subtitle: 'Validar código de entrega',
    icon: 'mdi-moped-outline',
    to: '/guard/deliveries',
    bg: '#EDE9FF', color: '#7C3AED',
  },
  {
    title: 'Cámaras',
    subtitle: 'Monitoreo del edificio',
    icon: 'mdi-cctv',
    to: '/guard/cameras',
    bg: '#FEE2E2', color: '#DC2626',
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
  <div class="guard-dash">
    <!-- Hero -->
    <div class="guard-hero">
      <p class="guard-greeting">{{ greeting() }},</p>
      <h1 class="guard-name">{{ authStore.userData?.firstName ?? 'Portero' }}</h1>
      <div class="guard-role-pill">
        <VIcon icon="mdi-shield-outline" size="13" />
        <span>Portería</span>
      </div>
    </div>

    <!-- Actions -->
    <div class="guard-actions-wrap">
      <RouterLink
        v-for="item in actions"
        :key="item.to"
        :to="item.to"
        class="guard-action-item"
      >
        <div class="guard-action-icon" :style="{ background: item.bg }">
          <VIcon :icon="item.icon" size="26" :color="item.color" />
        </div>
        <div class="guard-action-text">
          <span class="guard-action-title">{{ item.title }}</span>
          <span class="guard-action-sub">{{ item.subtitle }}</span>
        </div>
        <VIcon icon="mdi-chevron-right" size="18" color="#A1A1AA" />
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.guard-dash {
  padding: 0 20px 24px;
}

.guard-hero {
  padding: 20px 0 28px;
}

.guard-greeting {
  font-size: 15px;
  color: var(--color-text-secondary);
  font-weight: 500;
  margin: 0 0 2px;
}

.guard-name {
  font-size: 28px;
  font-weight: 800;
  color: var(--color-text-primary);
  letter-spacing: -0.8px;
  margin: 0 0 12px;
  line-height: 1.1;
}

.guard-role-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: rgba(16, 185, 129, 0.10);
  color: var(--color-guard);
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 600;
}

.guard-actions-wrap {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.guard-action-item {
  display: flex;
  align-items: center;
  gap: 14px;
  background: var(--color-surface);
  border-radius: 20px;
  padding: 16px;
  text-decoration: none;
  box-shadow: var(--shadow-xs);
  transition: transform 0.12s ease;
}

.guard-action-item:active {
  transform: scale(0.98);
}

.guard-action-icon {
  width: 54px;
  height: 54px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.guard-action-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.guard-action-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.guard-action-sub {
  font-size: 12px;
  color: var(--color-text-secondary);
}
</style>
