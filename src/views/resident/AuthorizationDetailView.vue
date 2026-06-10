<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthorizationsStore } from '@/stores/authorizations.store'
import dayjs from 'dayjs'

const route = useRoute()
const store = useAuthorizationsStore()

const auth = computed(() => store.items.find(a => a.id === route.params.id))
const fmt = (ts: any) => ts?.toDate ? dayjs(ts.toDate()).format('DD/MM/YYYY') : '—'
</script>

<template>
  <div>
    <ScreenHeader title="Autorización" />
    <VContainer v-if="auth" class="py-4">
      <div class="d-flex flex-column align-center mb-6">
        <AppAvatar :src="auth.person.photoUrl" icon="mdi-account-outline" size="100" class="mb-3" />
        <p class="text-h6 font-weight-bold mb-0">{{ auth.person.firstName }} {{ auth.person.lastName }}</p>
        <p class="text-body-2 text-medium-emphasis">CC {{ auth.person.idNumber }}</p>
      </div>

      <VList rounded="lg" border lines="two">
        <VListItem title="Validez desde" :subtitle="fmt(auth.validFrom)" />
        <VDivider />
        <VListItem title="Validez hasta" :subtitle="fmt(auth.validUntil)" />
        <VDivider />
        <VListItem title="Apto" :subtitle="auth.apartmentNumber" />
      </VList>

      <BtnPrimary class="mt-5" icon="mdi-share-variant" @click="() => {}">
        Compartir con portería
      </BtnPrimary>
    </VContainer>
  </div>
</template>
