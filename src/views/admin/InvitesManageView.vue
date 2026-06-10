<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useComplexStore } from '@/stores/complex.store'
import { useAuthStore } from '@/stores/auth.store'
import { useConfirmStore } from '@/stores/confirm.store'
import type { UserRole } from '@/types'

const complexStore = useComplexStore()
const authStore = useAuthStore()
const confirm = useConfirmStore()

async function handleDeleteInvite(code: string) {
  const ok = await confirm.ask({
    title: '¿Eliminar código?',
    message: `El código ${code} dejará de funcionar para siempre. Si solo quieres pausarlo, desactívalo con el switch.`,
  })
  if (ok) await complexStore.removeInvite(code)
}

const loading = ref(true)
const creating = ref(false)
const dialog = ref(false)
const copiedCode = ref('')

const newRole = ref<UserRole>('resident')
const newMaxUses = ref<number>(0)

onMounted(async () => {
  await complexStore.fetchCurrent()
  await complexStore.fetchInvites()
  loading.value = false
})

const ROLE_META: Record<string, { label: string; color: string; icon: string }> = {
  resident: { label: 'Residente', color: 'primary', icon: 'mdi-account-outline' },
  admin: { label: 'Co-admin', color: 'info', icon: 'mdi-shield-crown-outline' },
  guard: { label: 'Portería', color: 'success', icon: 'mdi-security' },
}

async function create() {
  creating.value = true
  try {
    await complexStore.createInvite({ role: newRole.value, maxUses: newMaxUses.value })
    await complexStore.fetchInvites()
    dialog.value = false
  } finally {
    creating.value = false
  }
}

async function copy(code: string) {
  const link = `${window.location.origin}/register?code=${code}`
  await navigator.clipboard.writeText(`Únete a ${complexStore.current?.name} en PortalResidencial.\nCódigo: ${code}\n${link}`)
  copiedCode.value = code
  setTimeout(() => (copiedCode.value = ''), 2000)
}

function usesLabel(maxUses: number, used: number) {
  return maxUses > 0 ? `${used}/${maxUses} usos` : `${used} usos · ilimitado`
}
</script>

<template>
  <div>
    <ScreenHeader title="Invitaciones" />
    <VContainer class="py-4">
      <p class="text-body-2 text-medium-emphasis mb-4">
        Crea códigos para que residentes, porteros o co-administradores se unan a
        <strong>{{ complexStore.current?.name }}</strong>.
      </p>

      <BtnPrimary icon="mdi-plus" class="mb-5" @click="dialog = true">Nuevo código</BtnPrimary>

      <LoadingSpinner v-if="loading" />
      <EmptyState
        v-else-if="!complexStore.invites.length"
        icon="mdi-ticket-confirmation-outline"
        message="Aún no has creado códigos de invitación"
      />

      <TransitionGroup v-else name="inv-list" tag="div" class="inv-list">
        <div v-for="inv in complexStore.invites" :key="inv.id" class="inv-card" :class="{ 'inv-card--off': !inv.active }">
          <div class="inv-main">
            <button class="inv-code" @click="copy(inv.id)">
              {{ inv.id }}
              <VIcon :icon="copiedCode === inv.id ? 'mdi-check' : 'mdi-content-copy'" size="13" />
            </button>
            <div class="inv-meta">
              <VChip size="x-small" :color="ROLE_META[inv.role].color" variant="tonal">
                <VIcon :icon="ROLE_META[inv.role].icon" size="11" class="mr-1" />
                {{ ROLE_META[inv.role].label }}
              </VChip>
              <span class="inv-uses">{{ usesLabel(inv.maxUses, inv.usedCount) }}</span>
            </div>
          </div>
          <div class="inv-actions">
            <VSwitch
              :model-value="inv.active"
              color="primary"
              hide-details
              density="compact"
              @update:model-value="(v: unknown) => complexStore.toggleInvite(inv.id, !!v)"
            />
            <button class="inv-delete" @click="handleDeleteInvite(inv.id)">
              <VIcon icon="mdi-delete-outline" size="17" />
            </button>
          </div>
        </div>
      </TransitionGroup>
    </VContainer>

    <!-- Crear código -->
    <VDialog v-model="dialog" max-width="420">
      <VCard rounded="xl" class="pa-5">
        <VCardTitle class="px-0 pt-0 font-weight-bold">Nuevo código de invitación</VCardTitle>
        <VSelect
          v-model="newRole"
          :items="[
            { title: 'Residente / Propietario', value: 'resident' },
            { title: 'Portería', value: 'guard' },
            { title: 'Co-administrador', value: 'admin' },
          ]"
          label="Rol"
          variant="outlined"
          density="comfortable"
          hide-details
          class="mb-3"
        />
        <VSelect
          v-model="newMaxUses"
          :items="[
            { title: 'Ilimitado', value: 0 },
            { title: '1 uso', value: 1 },
            { title: '5 usos', value: 5 },
            { title: '20 usos', value: 20 },
          ]"
          label="Límite de usos"
          variant="outlined"
          density="comfortable"
          hide-details
          class="mb-5"
        />
        <div class="d-flex" style="gap: 10px">
          <BtnSecondary @click="dialog = false">Cancelar</BtnSecondary>
          <BtnPrimary :loading="creating" @click="create">Crear</BtnPrimary>
        </div>
      </VCard>
    </VDialog>
  </div>
</template>

<style scoped>
.inv-list { display: flex; flex-direction: column; gap: 10px; }

.inv-card {
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  background: var(--color-surface); border-radius: 16px; padding: 12px 14px;
  box-shadow: var(--shadow-xs);
  transition: opacity 0.2s ease;
}
.inv-card--off { opacity: 0.55; }

.inv-main { display: flex; flex-direction: column; gap: 6px; min-width: 0; }

.inv-code {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 16px; font-weight: 800; letter-spacing: 1.5px;
  color: var(--color-primary); background: var(--color-primary-soft);
  border: none; border-radius: 10px; padding: 6px 12px; cursor: pointer;
  font-family: inherit;
  transition: transform 0.12s ease;
  align-self: flex-start;
}
.inv-code:active { transform: scale(0.95); }

.inv-meta { display: flex; align-items: center; gap: 8px; }
.inv-uses { font-size: 11.5px; color: var(--color-text-secondary); }

.inv-actions { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }

.inv-delete {
  width: 32px; height: 32px; border: none; border-radius: 50%;
  background: transparent; color: var(--color-text-tertiary);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: background 0.15s ease, color 0.15s ease;
}
.inv-delete:active { background: var(--color-error-soft); color: var(--color-error); }

.inv-list-enter-active { transition: all 0.25s ease; }
.inv-list-enter-from { opacity: 0; transform: translateY(8px); }
.inv-list-leave-active { transition: all 0.2s ease; position: absolute; opacity: 0; }
.inv-list-move { transition: transform 0.25s ease; }
</style>
