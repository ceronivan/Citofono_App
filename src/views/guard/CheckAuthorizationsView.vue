<script setup lang="ts">
import { ref } from 'vue'
import { useAuthorizationsStore } from '@/stores/authorizations.store'
import type { Authorization } from '@/types'
import dayjs from 'dayjs'

const store = useAuthorizationsStore()
const apt = ref('')
const results = ref<Authorization[]>([])
const loading = ref(false)
const searched = ref(false)

const fmt = (ts: any) => ts?.toDate ? dayjs(ts.toDate()).format('DD/MM/YYYY') : '—'

async function search() {
  if (!apt.value.trim()) return
  loading.value = true
  searched.value = true
  try {
    results.value = await store.fetchActiveByApartment(apt.value.trim())
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <ScreenHeader title="Consultar Autorizaciones" />
    <VContainer class="py-4">
      <div class="d-flex gap-2 mb-5">
        <VTextField
          v-model="apt"
          label="Número de apto"
          density="comfortable"
          hide-details
          @keyup.enter="search"
        />
        <VBtn color="success" :loading="loading" @click="search" class="text-none">
          Buscar
        </VBtn>
      </div>

      <EmptyState
        v-if="searched && !results.length && !loading"
        icon="mdi-shield-account-outline"
        message="No hay autorizaciones activas para este apto"
      />

      <VList v-if="results.length" rounded="lg" border>
        <template v-for="(a, i) in results" :key="a.id">
          <VListItem>
            <template #prepend>
              <AppAvatar :src="a.person.photoUrl" icon="mdi-account-outline" size="52" class="mr-3" />
            </template>
            <VListItemTitle class="font-weight-semibold">
              {{ a.person.firstName }} {{ a.person.lastName }}
            </VListItemTitle>
            <VListItemSubtitle>CC {{ a.person.idNumber }}</VListItemSubtitle>
            <VListItemSubtitle>Válido hasta: {{ fmt(a.validUntil) }}</VListItemSubtitle>
            <template #append>
              <StatusBadge status="active" />
            </template>
          </VListItem>
          <VDivider v-if="i < results.length - 1" />
        </template>
      </VList>
    </VContainer>
  </div>
</template>
