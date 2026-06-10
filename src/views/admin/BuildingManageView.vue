<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useComplexStore } from '@/stores/complex.store'

const complexStore = useComplexStore()

onMounted(async () => {
  await Promise.allSettled([complexStore.fetchCurrent(), complexStore.fetchUnits()])
})

const delinquentCount = computed(
  () => complexStore.units.filter((u) => u.feeStatus === 'delinquent').length,
)
const occupiedCount = computed(
  () => complexStore.units.filter((u) => u.ownerIds.length > 0).length,
)

const sections = computed(() => [
  {
    title: 'Unidades y cartera',
    sub: `${complexStore.units.length} aptos · ${delinquentCount.value} en mora`,
    icon: 'mdi-door',
    color: '#0EA5E9',
    bg: '#E0F2FE',
    to: '/admin/building/units',
  },
  {
    title: 'Amenidades',
    sub: `${complexStore.activeAmenities.length} zonas comunes`,
    icon: 'mdi-pool',
    color: '#16A34A',
    bg: '#DCFCE7',
    to: '/admin/building/amenities',
  },
  {
    title: 'Invitaciones',
    sub: 'Códigos para nuevos residentes',
    icon: 'mdi-ticket-confirmation-outline',
    color: '#7C3AED',
    bg: '#EDE9FF',
    to: '/admin/building/invites',
  },
  {
    title: 'Cámaras de seguridad',
    sub: 'CCTV del edificio',
    icon: 'mdi-cctv',
    color: '#DC2626',
    bg: '#FEE2E2',
    to: '/admin/cameras',
  },
  {
    title: 'Mantenimientos',
    sub: 'Ascensor, piscina y más',
    icon: 'mdi-wrench-clock',
    color: '#D97706',
    bg: '#FEF3C7',
    to: '/admin/maintenance',
  },
  {
    title: 'Registro de ingresos',
    sub: 'Visitas por apartamento',
    icon: 'mdi-clipboard-text-clock-outline',
    color: '#4338CA',
    bg: '#E0E7FF',
    to: '/admin/entry-log',
  },
])
</script>

<template>
  <div>
    <ScreenHeader title="Mi Edificio" />
    <VContainer class="py-4">
      <!-- Info del edificio -->
      <div class="bld-card">
        <div class="bld-avatar">
          <VIcon icon="mdi-office-building" size="26" color="white" />
        </div>
        <div class="bld-info">
          <h2 class="bld-name">{{ complexStore.current?.name ?? '…' }}</h2>
          <p class="bld-address">
            {{ complexStore.current?.address }}<template v-if="complexStore.current?.city">, {{ complexStore.current?.city }}</template>
          </p>
          <div class="bld-stats">
            <span class="bld-stat"><strong>{{ complexStore.towers.length }}</strong> torres</span>
            <span class="bld-stat"><strong>{{ complexStore.units.length }}</strong> aptos</span>
            <span class="bld-stat"><strong>{{ occupiedCount }}</strong> ocupados</span>
          </div>
        </div>
      </div>

      <!-- Secciones -->
      <div class="bld-sections">
        <RouterLink
          v-for="(s, i) in sections"
          :key="s.to"
          :to="s.to"
          class="bld-section"
          :style="{ animationDelay: `${i * 45}ms` }"
        >
          <div class="bld-section-icon" :style="{ background: s.bg, color: s.color }">
            <VIcon :icon="s.icon" size="22" />
          </div>
          <div class="bld-section-text">
            <span class="bld-section-title">{{ s.title }}</span>
            <span class="bld-section-sub">{{ s.sub }}</span>
          </div>
          <VIcon icon="mdi-chevron-right" size="20" class="bld-section-arrow" />
        </RouterLink>
      </div>
    </VContainer>
  </div>
</template>

<style scoped>
.bld-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: var(--color-surface);
  border-radius: 20px;
  padding: 18px;
  box-shadow: var(--shadow-sm);
  margin-bottom: 20px;
}

.bld-avatar {
  width: 56px; height: 56px;
  background: linear-gradient(135deg, #0EA5E9, #38BDF8);
  border-radius: 16px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

.bld-name { font-size: 17px; font-weight: 800; letter-spacing: -0.4px; margin: 0; color: var(--color-text-primary); }
.bld-address { font-size: 12.5px; color: var(--color-text-secondary); margin: 2px 0 8px; }

.bld-stats { display: flex; gap: 12px; }
.bld-stat { font-size: 12px; color: var(--color-text-secondary); }
.bld-stat strong { color: var(--color-text-primary); font-weight: 700; }

.bld-sections { display: flex; flex-direction: column; gap: 8px; }

.bld-section {
  display: flex;
  align-items: center;
  gap: 14px;
  background: var(--color-surface);
  border-radius: 16px;
  padding: 14px 16px;
  text-decoration: none;
  box-shadow: var(--shadow-xs);
  transition: transform 0.12s ease;
  animation: rise-in 0.35s ease both;
}
.bld-section:active { transform: scale(0.98); }

@keyframes rise-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.bld-section-icon {
  width: 44px; height: 44px; border-radius: 13px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

.bld-section-text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
.bld-section-title { font-size: 14px; font-weight: 700; color: var(--color-text-primary); }
.bld-section-sub { font-size: 12px; color: var(--color-text-secondary); }
.bld-section-arrow { color: var(--color-text-tertiary); }
</style>
