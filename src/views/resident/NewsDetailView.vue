<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useNewsStore } from '@/stores/news.store'
import type { ContentDetailConfig } from '@/components/shared/ContentDetail.vue'

const route = useRoute()
const store = useNewsStore()

onMounted(() => store.fetchOne(route.params.id as string))

const config: ContentDetailConfig = {
  typeLabel: 'Noticia',
  typeIcon: 'mdi-newspaper-variant-outline',
  typeColor: '#4F35E8',
  typeBg: '#EDE9FF',
}
</script>

<template>
  <ContentDetail
    :loading="!store.current"
    :title="store.current?.title"
    :body="store.current?.body"
    :published-at="store.current?.publishedAt"
    :has-attachment="store.current?.hasAttachment"
    :attachment-type="store.current?.attachmentType"
    :attachment-url="store.current?.attachmentUrl"
    :config="config"
  />
</template>
