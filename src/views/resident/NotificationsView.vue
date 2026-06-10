<script setup lang="ts">
import { onMounted } from 'vue'
import { useNotificationsStore } from '@/stores/notifications.store'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/es'

dayjs.extend(relativeTime)
dayjs.locale('es')

const store = useNotificationsStore()
onMounted(() => store.fetchMine())

const fmt = (ts: any) => ts?.toDate ? dayjs(ts.toDate()).fromNow() : ''

const ICONS: Record<string, string> = {
  visit: 'mdi-walk', mail: 'mdi-package-variant', reservation: 'mdi-calendar-outline',
  news: 'mdi-newspaper-variant-outline', pqr: 'mdi-message-alert-outline',
  damage: 'mdi-wrench-outline', circular: 'mdi-file-document-outline',
}
</script>

<template>
  <div>
    <ScreenHeader title="Notificaciones">
      <template #actions>
        <VBtn variant="text" size="small" class="text-none" @click="store.markAllRead()">
          Marcar todo leído
        </VBtn>
      </template>
    </ScreenHeader>

    <VContainer class="py-4">
      <LoadingSpinner v-if="store.loading" />
      <EmptyState v-else-if="!store.items.length" icon="mdi-bell-outline" message="No tienes notificaciones" />

      <VList v-else rounded="lg" border>
        <template v-for="(n, i) in store.items" :key="n.id">
          <VListItem
            :class="{ 'bg-primary-soft': !n.isRead }"
            @click="store.markRead(n.id)"
          >
            <template #prepend>
              <VIcon :icon="ICONS[n.type] ?? 'mdi-bell-outline'" color="primary" class="mr-3" />
            </template>
            <VListItemTitle class="font-weight-semibold" :class="{ 'text-primary': !n.isRead }">
              {{ n.title }}
            </VListItemTitle>
            <VListItemSubtitle>{{ n.body }}</VListItemSubtitle>
            <VListItemSubtitle class="text-caption">{{ fmt(n.createdAt) }}</VListItemSubtitle>
            <template #append>
              <VIcon v-if="!n.isRead" icon="mdi-circle-small" color="primary" />
            </template>
          </VListItem>
          <VDivider v-if="i < store.items.length - 1" />
        </template>
      </VList>
    </VContainer>
  </div>
</template>
