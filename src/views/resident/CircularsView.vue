<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useCircularsStore } from '@/stores/circulars.store'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/es'

dayjs.extend(relativeTime)
dayjs.locale('es')

const store = useCircularsStore()
const search = ref('')

onMounted(() => store.fetchAll())

const filtered = computed(() => {
  const q = search.value.toLowerCase()
  if (!q) return store.items
  return store.items.filter(c => c.title.toLowerCase().includes(q))
})

const fmtRelative = (ts: any) => ts?.toDate ? dayjs(ts.toDate()).fromNow() : ''
const fmtDate    = (ts: any) => ts?.toDate ? dayjs(ts.toDate()).format('D MMM YYYY') : ''
</script>

<template>
  <div class="circulars-screen">

    <div class="screen-top">
      <div class="screen-title-row">
        <BackBtn />
        <h1 class="screen-title">Circulares</h1>
      </div>
      <div class="search-wrap">
        <VIcon icon="mdi-magnify" size="18" class="search-icon" />
        <input
          v-model="search"
          type="search"
          placeholder="Buscar..."
          class="search-input"
        />
        <button v-if="search" class="search-clear" @click="search = ''">
          <VIcon icon="mdi-close-circle" size="16" />
        </button>
      </div>
    </div>

    <LoadingSpinner v-if="store.loading" />

    <EmptyState
      v-else-if="!filtered.length"
      icon="mdi-file-document-outline"
      :message="search ? 'Sin resultados para tu búsqueda' : 'No hay circulares publicadas'"
    />

    <div v-else class="card-list">
      <RouterLink
        v-for="c in filtered"
        :key="c.id"
        :to="`/circulars/${c.id}`"
        class="circular-card"
      >
        <!-- Image header (if attached image) -->
        <div
          v-if="c.hasAttachment && c.attachmentType === 'image' && c.attachmentUrl"
          class="circular-card-image"
        >
          <img :src="c.attachmentUrl" :alt="c.title" />
        </div>

        <div class="circular-card-body">
          <div class="circular-card-meta">
            <div class="circular-card-type-chip">
              <VIcon icon="mdi-file-document-outline" size="12" />
              <span>Circular</span>
            </div>
            <time class="circular-card-date" :title="fmtDate(c.publishedAt)">
              {{ fmtRelative(c.publishedAt) }}
            </time>
          </div>

          <h2 class="circular-card-title">{{ c.title }}</h2>

          <p class="circular-card-preview">{{ c.body }}</p>

          <div class="circular-card-footer">
            <span v-if="c.hasAttachment && c.attachmentType === 'pdf'" class="circular-card-attach">
              <VIcon icon="mdi-file-pdf-box" size="13" color="#DC2626" />
              Documento adjunto
            </span>
            <span v-else-if="c.hasAttachment" class="circular-card-attach">
              <VIcon icon="mdi-image-outline" size="13" />
              Imagen
            </span>
            <span class="circular-card-read">
              Leer más
              <VIcon icon="mdi-arrow-right" size="14" />
            </span>
          </div>
        </div>
      </RouterLink>
    </div>

  </div>
</template>

<style scoped>
.circulars-screen {
  padding-bottom: 24px;
}

/* Sticky top */
.screen-top {
  position: sticky;
  top: 0;
  z-index: 5;
  background: var(--color-bg);
  padding: 4px 20px 14px;
}

.screen-title-row {
  height: 52px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.screen-title {
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -0.5px;
  color: var(--color-text-primary);
  margin: 0;
}

.search-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--color-surface);
  border-radius: 13px;
  padding: 0 12px;
  height: 42px;
  box-shadow: var(--shadow-xs);
}

.search-icon { color: var(--color-text-tertiary); flex-shrink: 0; }

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 15px;
  font-family: inherit;
  color: var(--color-text-primary);
  outline: none;
  min-width: 0;
}
.search-input::placeholder { color: var(--color-text-tertiary); }

.search-clear {
  border: none;
  background: none;
  cursor: pointer;
  color: var(--color-text-tertiary);
  display: flex;
  align-items: center;
  padding: 0;
}

/* Card list */
.card-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0 16px;
}

/* Individual circular card */
.circular-card {
  display: block;
  background: var(--color-surface);
  border-radius: 20px;
  box-shadow: var(--shadow-sm);
  text-decoration: none;
  overflow: hidden;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}

.circular-card:active {
  transform: scale(0.98);
  box-shadow: var(--shadow-xs);
}

.circular-card-image {
  width: 100%;
  height: 160px;
  overflow: hidden;
}

.circular-card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.circular-card-body {
  padding: 16px 18px 14px;
}

.circular-card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.circular-card-type-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #E0E7FF;
  color: #4338CA;
  padding: 3px 9px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 700;
}

.circular-card-date {
  font-size: 11px;
  color: var(--color-text-tertiary);
  font-weight: 500;
}

.circular-card-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: 1.35;
  margin: 0 0 8px;
  letter-spacing: -0.2px;
}

.circular-card-preview {
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin: 0 0 14px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.circular-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid var(--color-border-light);
}

.circular-card-attach {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--color-text-tertiary);
  font-weight: 500;
}

.circular-card-read {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 13px;
  font-weight: 700;
  color: #4338CA;
  margin-left: auto;
}
</style>
