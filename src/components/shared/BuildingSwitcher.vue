<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth.store'

const authStore = useAuthStore()
const sheet = ref(false)

const ROLE_META: Record<string, { label: string; color: string; icon: string }> = {
  resident: { label: 'Residente', color: '#4F35E8', icon: 'mdi-account-outline' },
  admin: { label: 'Admin', color: '#0EA5E9', icon: 'mdi-shield-crown-outline' },
  guard: { label: 'Portería', color: '#10B981', icon: 'mdi-security' },
}

const DASHBOARD: Record<string, string> = {
  resident: '/',
  admin: '/admin',
  guard: '/guard',
}

const activeName = computed(
  () => authStore.activeMembership?.complexName ?? 'Mi edificio',
)

const showSwitcher = computed(
  () => authStore.memberships.length > 1 || authStore.hasAdminMembership,
)

function select(complexId: string) {
  if (complexId === authStore.complexId) {
    sheet.value = false
    return
  }
  const target = authStore.memberships.find((m) => m.complexId === complexId)
  authStore.setActiveComplex(complexId)
  sheet.value = false
  // Recarga completa: garantiza que todos los stores se reinicien con el nuevo edificio
  window.location.assign(DASHBOARD[target?.role ?? 'resident'])
}

function createBuilding() {
  sheet.value = false
  window.location.assign('/setup/building')
}
</script>

<template>
  <div>
    <button class="bs-pill" :class="{ 'bs-pill--static': !showSwitcher }" @click="showSwitcher && (sheet = true)">
      <div class="bs-pill-icon">
        <VIcon icon="mdi-office-building-outline" size="15" />
      </div>
      <span class="bs-pill-name">{{ activeName }}</span>
      <VIcon v-if="showSwitcher" icon="mdi-unfold-more-horizontal" size="15" class="bs-pill-chevron" />
    </button>

    <VBottomSheet v-model="sheet" max-width="480">
      <div class="bs-sheet">
        <div class="bs-sheet-handle" />
        <h3 class="bs-sheet-title">Mis edificios</h3>
        <p class="bs-sheet-sub">Cambia entre los edificios a los que perteneces</p>

        <TransitionGroup name="bs-list" tag="div" class="bs-list" appear>
          <button
            v-for="(m, i) in authStore.memberships"
            :key="m.complexId"
            class="bs-item"
            :class="{ 'bs-item--active': m.complexId === authStore.complexId }"
            :style="{ '--stagger': `${i * 40}ms` }"
            @click="select(m.complexId)"
          >
            <div class="bs-item-avatar" :style="{ background: ROLE_META[m.role]?.color + '18', color: ROLE_META[m.role]?.color }">
              <VIcon icon="mdi-office-building" size="20" />
            </div>
            <div class="bs-item-info">
              <span class="bs-item-name">{{ m.complexName }}</span>
              <span class="bs-item-meta">
                <VIcon :icon="ROLE_META[m.role]?.icon" size="11" />
                {{ ROLE_META[m.role]?.label }}
                <template v-if="m.apartmentNumber"> · Apto {{ m.apartmentNumber }}</template>
              </span>
            </div>
            <VIcon
              v-if="m.complexId === authStore.complexId"
              icon="mdi-check-circle"
              size="20"
              :style="{ color: ROLE_META[m.role]?.color }"
            />
          </button>
        </TransitionGroup>

        <button v-if="authStore.hasAdminMembership" class="bs-create" @click="createBuilding">
          <div class="bs-create-icon">
            <VIcon icon="mdi-plus" size="18" />
          </div>
          <span>Crear edificio nuevo</span>
        </button>
      </div>
    </VBottomSheet>
  </div>
</template>

<style scoped>
.bs-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--color-surface);
  border: 1px solid var(--color-border-light);
  border-radius: 9999px;
  padding: 5px 10px 5px 6px;
  cursor: pointer;
  box-shadow: var(--shadow-xs);
  transition: transform 0.12s ease, box-shadow 0.15s ease;
  max-width: 200px;
}
.bs-pill:active { transform: scale(0.96); }
.bs-pill--static { cursor: default; }

.bs-pill-icon {
  width: 24px;
  height: 24px;
  border-radius: 9999px;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.bs-pill-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bs-pill-chevron { color: var(--color-text-tertiary); flex-shrink: 0; }

/* ── Sheet ── */
.bs-sheet {
  background: var(--color-surface);
  border-radius: 24px 24px 0 0;
  padding: 8px 20px max(20px, env(safe-area-inset-bottom, 20px));
}

.bs-sheet-handle {
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: var(--color-border);
  margin: 6px auto 14px;
}

.bs-sheet-title {
  font-size: 18px;
  font-weight: 800;
  letter-spacing: -0.4px;
  color: var(--color-text-primary);
  margin: 0;
}

.bs-sheet-sub {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin: 2px 0 16px;
}

.bs-list { display: flex; flex-direction: column; gap: 8px; }

.bs-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--color-bg);
  border: 1.5px solid transparent;
  border-radius: 16px;
  cursor: pointer;
  text-align: left;
  width: 100%;
  transition: transform 0.12s ease, border-color 0.15s ease, background 0.15s ease;
}
.bs-item:active { transform: scale(0.98); }
.bs-item--active { border-color: var(--color-primary); background: var(--color-surface); }

.bs-item-avatar {
  width: 42px;
  height: 42px;
  border-radius: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.bs-item-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }

.bs-item-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bs-item-meta {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11.5px;
  color: var(--color-text-secondary);
  font-weight: 500;
}

.bs-create {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  margin-top: 12px;
  padding: 12px;
  border: 1.5px dashed var(--color-border);
  border-radius: 16px;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-primary);
  transition: background 0.15s ease, transform 0.12s ease;
}
.bs-create:active { transform: scale(0.98); background: var(--color-primary-10); }

.bs-create-icon {
  width: 42px;
  height: 42px;
  border-radius: 13px;
  background: var(--color-primary-soft);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Stagger animation */
.bs-list-enter-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
  transition-delay: var(--stagger, 0ms);
}
.bs-list-enter-from { opacity: 0; transform: translateY(10px); }
</style>
