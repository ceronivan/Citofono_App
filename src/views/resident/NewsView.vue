<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useNewsStore } from '@/stores/news.store'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/es'

dayjs.extend(relativeTime)
dayjs.locale('es')

const store = useNewsStore()
const search = ref('')

onMounted(() => store.fetchAll())

const filtered = computed(() => {
  const q = search.value.toLowerCase()
  if (!q) return store.items
  return store.items.filter(n => n.title.toLowerCase().includes(q))
})

const fmtRelative = (ts: any) => ts?.toDate ? dayjs(ts.toDate()).fromNow() : ''
const fmtDate    = (ts: any) => ts?.toDate ? dayjs(ts.toDate()).format('D MMM YYYY') : ''
</script>

<template>
  <div class="news-screen">

    <!-- Sticky header with title + search -->
    <div class="screen-top">
      <div class="screen-title-row">
        <BackBtn />
        <h1 class="screen-title">Noticias</h1>
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

    <!-- States -->
    <LoadingSpinner v-if="store.loading" />

    <EmptyState
      v-else-if="!filtered.length"
      icon="mdi-newspaper-variant-outline"
      :message="search ? 'Sin resultados para tu búsqueda' : 'No hay noticias publicadas'"
    />

    <!-- Card list -->
    <div v-else class="card-list">
      <RouterLink
        v-for="n in filtered"
        :key="n.id"
        :to="`/news/${n.id}`"
        class="news-card"
      >
        <!-- Optional image header -->
        <div
          v-if="n.hasAttachment && n.attachmentType === 'image' && n.attachmentUrl"
          class="news-card-image"
        >
          <img :src="n.attachmentUrl" :alt="n.title" />
        </div>

        <div class="news-card-body">
          <!-- Meta row -->
          <div class="news-card-meta">
            <div class="news-card-type-chip">
              <VIcon icon="mdi-newspaper-variant-outline" size="12" />
              <span>Noticia</span>
            </div>
            <time class="news-card-date" :title="fmtDate(n.publishedAt)">
              {{ fmtRelative(n.publishedAt) }}
            </time>
          </div>

          <!-- Title -->
          <h2 class="news-card-title">{{ n.title }}</h2>

          <!-- Body preview -->
          <p class="news-card-preview">{{ n.body }}</p>

          <!-- Footer -->
          <div class="news-card-footer">
            <span v-if="n.hasAttachment && n.attachmentType === 'pdf'" class="news-card-attach">
              <VIcon icon="mdi-file-pdf-box" size="13" color="#DC2626" />
              Documento adjunto
            </span>
            <span v-else-if="n.hasAttachment" class="news-card-attach">
              <VIcon icon="mdi-image-outline" size="13" />
              Imagen
            </span>
            <span class="news-card-read">
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
.news-screen {
  padding-bottom: 24px;
}

/* ── Sticky top ── */
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

/* Search */
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

/* ── Card list ── */
.card-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0 16px;
}

/* Individual news card */
.news-card {
  display: block;
  background: var(--color-surface);
  border-radius: 20px;
  box-shadow: var(--shadow-sm);
  text-decoration: none;
  overflow: hidden;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}

.news-card:active {
  transform: scale(0.98);
  box-shadow: var(--shadow-xs);
}

/* Optional image header */
.news-card-image {
  width: 100%;
  height: 160px;
  overflow: hidden;
}

.news-card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* Card content */
.news-card-body {
  padding: 16px 18px 14px;
}

/* Meta: type chip + date */
.news-card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.news-card-type-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  padding: 3px 9px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 700;
}

.news-card-date {
  font-size: 11px;
  color: var(--color-text-tertiary);
  font-weight: 500;
}

/* Title */
.news-card-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: 1.35;
  margin: 0 0 8px;
  letter-spacing: -0.2px;
}

/* Preview body */
.news-card-preview {
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin: 0 0 14px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Footer: attachment tag + read more */
.news-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid var(--color-border-light);
}

.news-card-attach {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--color-text-tertiary);
  font-weight: 500;
}

.news-card-read {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 13px;
  font-weight: 700;
  color: var(--color-primary);
  margin-left: auto;
}
</style>
