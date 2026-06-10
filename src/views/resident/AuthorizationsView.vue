<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthorizationsStore } from '@/stores/authorizations.store'
import { useConfirmStore } from '@/stores/confirm.store'
import dayjs from 'dayjs'
import type { Authorization } from '@/types'

const store = useAuthorizationsStore()
const confirm = useConfirmStore()

onMounted(() => store.fetchMine())

async function handleDelete(auth: Authorization) {
  const ok = await confirm.ask({
    title: '¿Eliminar autorización?',
    message: `${auth.person.firstName} ${auth.person.lastName} ya no podrá ingresar con esta autorización.`,
  })
  if (ok) await store.remove(auth.id)
}

function isExpired(validUntil: any) {
  return dayjs(validUntil?.toDate?.()).isBefore(dayjs())
}

function formatDate(ts: any) {
  return ts?.toDate ? dayjs(ts.toDate()).format('DD/MM/YYYY') : '—'
}
</script>

<template>
  <div>
    <ScreenHeader title="Mis Autorizaciones" />

    <VContainer class="py-4">
      <BtnPrimary icon="mdi-plus" class="mb-4" to="/authorizations/new">
        Agregar Autorización
      </BtnPrimary>

      <LoadingSpinner v-if="store.loading" />

      <EmptyState
        v-else-if="!store.items.length"
        icon="mdi-shield-account-outline"
        message="No tienes personas autorizadas"
        action-label="Agregar autorización"
        @action="$router.push('/authorizations/new')"
      />

      <VList v-else rounded="lg" border>
        <template v-for="(auth, i) in store.items" :key="auth.id">
          <VListItem>
            <template #prepend>
              <AppAvatar :src="auth.person.photoUrl" icon="mdi-account-outline" size="48" class="mr-3" />
            </template>

            <VListItemTitle class="font-weight-semibold">
              {{ auth.person.firstName }} {{ auth.person.lastName }}
            </VListItemTitle>
            <VListItemSubtitle>
              CC {{ auth.person.idNumber }}
              · {{ formatDate(auth.validFrom) }} → {{ formatDate(auth.validUntil) }}
            </VListItemSubtitle>

            <template #append>
              <div class="d-flex flex-column align-center gap-1">
                <StatusBadge :status="isExpired(auth.validUntil) ? 'cancelled' : 'active'" />
                <div class="d-flex gap-1 mt-1">
                  <BtnIcon icon="mdi-eye-outline" color="primary" :size="28" @click="$router.push(`/authorizations/${auth.id}`)" />
                  <BtnIcon icon="mdi-pencil" color="primary" :size="28" @click="$router.push(`/authorizations/${auth.id}/edit`)" />
                  <BtnIcon icon="mdi-delete" color="danger" :size="28" @click="handleDelete(auth)" />
                </div>
              </div>
            </template>
          </VListItem>
          <VDivider v-if="i < store.items.length - 1" />
        </template>
      </VList>
    </VContainer>
  </div>
</template>
