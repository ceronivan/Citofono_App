<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useCircularsStore } from '@/stores/circulars.store'
import type { ContentDetailConfig } from '@/components/shared/ContentDetail.vue'

const route = useRoute()
const store = useCircularsStore()

onMounted(() => store.fetchOne(route.params.id as string))

const config: ContentDetailConfig = {
  typeLabel: 'Circular',
  typeIcon: 'mdi-file-document-outline',
  typeColor: '#4338CA',
  typeBg: '#E0E7FF',
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
