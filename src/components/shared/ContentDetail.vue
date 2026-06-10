<script setup lang="ts">
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/es'
dayjs.extend(relativeTime)
dayjs.locale('es')

export interface ContentDetailConfig {
  typeLabel: string
  typeIcon: string
  typeColor: string
  typeBg: string
}

const props = defineProps<{
  loading: boolean
  title?: string
  body?: string
  publishedAt?: any        // Firestore Timestamp
  hasAttachment?: boolean
  attachmentType?: 'image' | 'pdf'
  attachmentUrl?: string
  config: ContentDetailConfig
}>()

const fmt = (ts: any) =>
  ts?.toDate ? dayjs(ts.toDate()).format('D [de] MMMM [de] YYYY') : ''

const fmtRelative = (ts: any) =>
  ts?.toDate ? dayjs(ts.toDate()).fromNow() : ''

function openAttachment() {
  if (props.attachmentUrl) window.open(props.attachmentUrl, '_blank', 'noopener')
}
</script>

<template>
  <div class="content-detail">
    <!-- Back button (floating, no title bar) -->
    <ScreenHeader />

    <!-- Loading state -->
    <div v-if="loading" class="detail-loading">
      <div class="skeleton-chip" />
      <div class="skeleton-title" />
      <div class="skeleton-title short" />
      <div class="skeleton-divider" />
      <div class="skeleton-line" v-for="n in 6" :key="n" :style="n === 5 ? 'width: 60%' : ''" />
    </div>

    <!-- Content -->
    <article v-else-if="title" class="detail-article">

      <!-- Type + date -->
      <header class="detail-header">
        <div class="detail-type-chip" :style="{ background: config.typeBg, color: config.typeColor }">
          <VIcon :icon="config.typeIcon" size="13" />
          <span>{{ config.typeLabel }}</span>
        </div>
        <time class="detail-date" :title="fmt(publishedAt)">{{ fmtRelative(publishedAt) }}</time>
      </header>

      <!-- Title -->
      <h1 class="detail-title">{{ title }}</h1>

      <!-- Divider -->
      <div class="detail-rule" />

      <!-- Body -->
      <p class="detail-body">{{ body }}</p>

      <!-- Attachment -->
      <section v-if="hasAttachment && attachmentUrl" class="detail-attachment">
        <p class="attachment-header">
          <VIcon icon="mdi-paperclip" size="13" />
          Adjunto
        </p>

        <!-- Image -->
        <div v-if="attachmentType === 'image'" class="attachment-image-wrap" @click="openAttachment">
          <img :src="attachmentUrl" class="attachment-image" alt="Imagen adjunta" />
          <div class="attachment-image-overlay">
            <VIcon icon="mdi-open-in-new" size="16" color="white" />
          </div>
        </div>

        <!-- PDF -->
        <button v-else class="attachment-pdf" @click="openAttachment">
          <div class="attachment-pdf-icon">
            <VIcon icon="mdi-file-pdf-box" size="24" color="#DC2626" />
          </div>
          <div class="attachment-pdf-info">
            <span class="attachment-pdf-label">Documento PDF</span>
            <span class="attachment-pdf-sub">Toca para abrir</span>
          </div>
          <VIcon icon="mdi-chevron-right" size="18" color="#A1A1AA" />
        </button>
      </section>

    </article>

    <!-- Empty fallback -->
    <EmptyState v-else icon="mdi-file-document-outline" message="No se encontró el contenido" />
  </div>
</template>

<style scoped>
.content-detail {
  min-height: 100dvh;
  background: var(--color-bg);
}

/* ── Article layout ── */
.detail-article {
  padding: 4px 20px 48px;
}

/* Type + date row */
.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.detail-type-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.1px;
}

.detail-date {
  font-size: 12px;
  color: var(--color-text-tertiary);
  font-weight: 500;
}

/* Title */
.detail-title {
  font-size: 24px;
  font-weight: 800;
  color: var(--color-text-primary);
  letter-spacing: -0.5px;
  line-height: 1.25;
  margin: 0 0 20px;
}

/* Horizontal rule */
.detail-rule {
  height: 1px;
  background: var(--color-border-light);
  margin-bottom: 20px;
}

/* Body text */
.detail-body {
  font-size: 15px;
  color: var(--color-text-primary);
  line-height: 1.8;
  white-space: pre-wrap;
  margin: 0;
}

/* ── Attachment ── */
.detail-attachment {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid var(--color-border-light);
}

.attachment-header {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 700;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.6px;
  margin: 0 0 12px;
}

/* Image attachment */
.attachment-image-wrap {
  position: relative;
  border-radius: 18px;
  overflow: hidden;
  cursor: pointer;
}

.attachment-image {
  width: 100%;
  max-height: 280px;
  object-fit: cover;
  display: block;
  transition: opacity 0.15s;
}
.attachment-image-wrap:active .attachment-image { opacity: 0.85; }

.attachment-image-overlay {
  position: absolute;
  bottom: 10px;
  right: 10px;
  width: 32px;
  height: 32px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
}

/* PDF attachment */
.attachment-pdf {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 14px;
  background: var(--color-surface);
  border: none;
  border-radius: 18px;
  padding: 16px;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: opacity 0.12s;
  font-family: inherit;
}
.attachment-pdf:active { opacity: 0.8; }

.attachment-pdf-icon {
  width: 48px;
  height: 48px;
  background: #FEE2E2;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.attachment-pdf-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
  text-align: left;
}

.attachment-pdf-label {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.attachment-pdf-sub {
  font-size: 12px;
  color: var(--color-text-secondary);
}

/* ── Skeleton loading ── */
.detail-loading {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.skeleton-chip {
  height: 24px;
  width: 80px;
  background: var(--color-border);
  border-radius: 9999px;
}

.skeleton-title {
  height: 28px;
  background: var(--color-border);
  border-radius: 8px;
  width: 90%;
}
.skeleton-title.short { width: 60%; }

.skeleton-divider {
  height: 1px;
  background: var(--color-border);
  margin: 4px 0;
}

.skeleton-line {
  height: 14px;
  background: var(--color-border);
  border-radius: 6px;
  width: 100%;
}
</style>
