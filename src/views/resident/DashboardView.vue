<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useNotificationsStore } from '@/stores/notifications.store'
import { useMailStore } from '@/stores/mail.store'
import { useNewsStore } from '@/stores/news.store'
import { useConfirmStore } from '@/stores/confirm.store'

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
const notifStore = useNotificationsStore()
const mailStore = useMailStore()
const newsStore = useNewsStore()

onMounted(async () => {
  await Promise.allSettled([
    notifStore.fetchMine(),
    mailStore.fetchMine(),
    newsStore.fetchAll(),
  ])
})

// Summary counts
const pendingMail = computed(() =>
  mailStore.items.filter(m => m.status === 'pending' || m.status === 'delivered').length,
)
const unreadNotifs = computed(() => notifStore.unreadCount)

// News from last 7 days
const recentNews = computed(() => {
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000
  return newsStore.items.filter(n => {
    const ts = (n.publishedAt as any)?.toDate?.()
    return ts && ts.getTime() > cutoff
  }).length
})

const summaryCards = computed(() => [
  {
    label: 'Paquetes',
    sublabel: 'en portería',
    value: pendingMail.value,
    icon: 'mdi-package-variant-closed',
    bg: '#FEF3C7',
    color: '#D97706',
    to: '/mail',
    urgent: pendingMail.value > 0,
  },
  {
    label: 'Avisos',
    sublabel: 'sin leer',
    value: unreadNotifs.value,
    icon: 'mdi-bell-outline',
    bg: '#EDE9FF',
    color: '#4F35E8',
    to: '/notifications',
    urgent: unreadNotifs.value > 0,
  },
  {
    label: 'Noticias',
    sublabel: 'esta semana',
    value: recentNews.value,
    icon: 'mdi-newspaper-variant-outline',
    bg: '#DBEAFE',
    color: '#2563EB',
    to: '/news',
    urgent: false,
  },
])

const modules = [
  { title: 'Domicilios',        icon: 'mdi-moped-outline',             to: '/deliveries',     bg: '#FEF3C7', color: '#D97706' },
  { title: 'Mis Reservas',      icon: 'mdi-calendar-check-outline',    to: '/reservations',   bg: '#DCFCE7', color: '#16A34A' },
  { title: 'Autorizaciones',    icon: 'mdi-shield-check-outline',      to: '/authorizations', bg: '#F0FDF4', color: '#15803D' },
  { title: 'Mis Visitas',       icon: 'mdi-walk',                      to: '/visits',         bg: '#DBEAFE', color: '#2563EB' },
  { title: 'Mis Vehículos',     icon: 'mdi-car-outline',               to: '/vehicles',       bg: '#FFF7ED', color: '#C2410C' },
  { title: 'Mantenimientos',    icon: 'mdi-wrench-clock',              to: '/maintenance',    bg: '#FCE7F3', color: '#DB2777' },
  { title: 'Circulares',        icon: 'mdi-file-document-outline',     to: '/circulars',      bg: '#E0E7FF', color: '#4338CA' },
  { title: 'Mi Perfil',         icon: 'mdi-account-outline',           to: '/profile',        bg: '#EDE9FF', color: '#7C3AED' },
]

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 18) return 'Buenas tardes'
  return 'Buenas noches'
}
</script>

<template>
  <div class="dashboard">
    <!-- Top bar -->
    <header class="dash-header">
      <div class="dash-header-inner">
        <div class="dash-logo-mark">
          <VIcon icon="mdi-shield-home" size="18" color="white" />
        </div>
        <BuildingSwitcher />
        <div style="flex: 1" />
        <NotificationBell />
        <button class="dash-logout" aria-label="Cerrar sesión" @click="handleLogout">
          <VIcon icon="mdi-logout-variant" size="19" />
        </button>
      </div>
    </header>

    <div class="dash-body">
      <!-- Greeting -->
      <div class="dash-hero">
        <p class="dash-greeting">{{ greeting() }},</p>
        <h1 class="dash-name">{{ authStore.userData?.firstName ?? 'Residente' }}</h1>
        <div class="dash-apt-pill">
          <VIcon icon="mdi-door" size="13" />
          <span>Apto {{ authStore.userData?.apartmentNumber }}</span>
        </div>
      </div>

      <!-- Summary cards (Satispay-style) -->
      <div class="summary-row">
        <RouterLink
          v-for="card in summaryCards"
          :key="card.to"
          :to="card.to"
          class="summary-card"
          :class="{ 'summary-card--urgent': card.urgent }"
        >
          <div class="summary-icon" :style="{ background: card.bg }">
            <VIcon :icon="card.icon" size="18" :color="card.color" />
          </div>
          <div class="summary-value" :style="card.urgent ? { color: card.color } : {}">
            {{ card.value }}
          </div>
          <div class="summary-label">{{ card.label }}</div>
          <div class="summary-sublabel">{{ card.sublabel }}</div>
        </RouterLink>
      </div>

      <!-- Quick modules grid -->
      <section class="dash-section">
        <h2 class="dash-section-title">Más servicios</h2>
        <div class="module-grid">
          <RouterLink
            v-for="mod in modules"
            :key="mod.to"
            :to="mod.to"
            class="module-card"
          >
            <div class="module-icon-wrap" :style="{ background: mod.bg }">
              <VIcon :icon="mod.icon" size="22" :color="mod.color" />
            </div>
            <span class="module-label">{{ mod.title }}</span>
          </RouterLink>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  background: var(--color-bg);
  min-height: 100dvh;
}

/* Header */
.dash-header {
  position: sticky;
  top: 0;
  z-index: 10;
  padding-top: env(safe-area-inset-top, 0);
  background: var(--color-bg);
}

.dash-header-inner {
  display: flex;
  align-items: center;
  height: 52px;
  padding: 0 20px;
  gap: 12px;
}

.dash-logo-mark {
  width: 34px;
  height: 34px;
  background: linear-gradient(135deg, #4F35E8 0%, #7B64F0 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dash-logout {
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
  flex-shrink: 0;
  transition: background 0.15s ease, color 0.15s ease, transform 0.12s ease;
}
.dash-logout:active {
  transform: scale(0.92);
  background: var(--color-error-soft);
  color: var(--color-error);
}

/* Body */
.dash-body {
  padding: 4px 20px 24px;
}

/* Greeting */
.dash-hero {
  padding: 12px 0 20px;
}

.dash-greeting {
  font-size: 14px;
  color: var(--color-text-secondary);
  font-weight: 500;
  margin: 0 0 2px;
}

.dash-name {
  font-size: 26px;
  font-weight: 800;
  color: var(--color-text-primary);
  letter-spacing: -0.7px;
  margin: 0 0 10px;
  line-height: 1.1;
}

.dash-apt-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 600;
}

/* ── Summary row (Satispay-style) ── */
.summary-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 28px;
}

.summary-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  background: var(--color-surface);
  border-radius: 18px;
  padding: 14px 12px;
  text-decoration: none;
  box-shadow: var(--shadow-xs);
  border: 1.5px solid transparent;
  transition: transform 0.12s ease, border-color 0.15s ease;
}

.summary-card:active {
  transform: scale(0.96);
}

.summary-card--urgent {
  border-color: var(--color-border-light);
}

.summary-icon {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.summary-value {
  font-size: 22px;
  font-weight: 800;
  color: var(--color-text-primary);
  letter-spacing: -0.5px;
  line-height: 1;
  margin-top: 2px;
}

.summary-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-primary);
  line-height: 1.2;
}

.summary-sublabel {
  font-size: 10px;
  color: var(--color-text-tertiary);
  font-weight: 400;
  line-height: 1;
}

/* ── Module grid ── */
.dash-section {
  margin-bottom: 24px;
}

.dash-section-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--color-text-tertiary);
  letter-spacing: 0.6px;
  text-transform: uppercase;
  margin: 0 0 12px;
}

.module-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.module-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 14px 8px 12px;
  background: var(--color-surface);
  border-radius: 18px;
  text-decoration: none;
  box-shadow: var(--shadow-xs);
  transition: transform 0.12s ease;
}

.module-card:active {
  transform: scale(0.95);
}

.module-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.module-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-primary);
  text-align: center;
  line-height: 1.3;
  max-width: 68px;
}
</style>
