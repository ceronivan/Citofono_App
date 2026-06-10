<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useNewsStore } from '@/stores/news.store'
import type { News } from '@/types'
import dayjs from 'dayjs'

const store = useNewsStore()
onMounted(() => store.fetchAll())

const dialog = ref(false)
const saving = ref(false)
const editingId = ref<string | null>(null)
const form = ref({ title: '', body: '' })
const attachment = ref<File | null>(null)
const attachmentPreview = ref<string | null>(null)

function openCreate() {
  editingId.value = null
  form.value = { title: '', body: '' }
  attachment.value = null
  attachmentPreview.value = null
  dialog.value = true
}

function openEdit(n: News) {
  editingId.value = n.id
  form.value = { title: n.title, body: n.body }
  attachment.value = null
  attachmentPreview.value = n.attachmentUrl ?? null
  dialog.value = true
}

function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0] ?? null
  attachment.value = file
  if (file) attachmentPreview.value = URL.createObjectURL(file)
}

async function handleSave() {
  if (!form.value.title.trim() || !form.value.body.trim()) return
  saving.value = true
  try {
    if (editingId.value) {
      await store.update(editingId.value, form.value.title, form.value.body, attachment.value ?? undefined)
    } else {
      await store.create(form.value.title, form.value.body, attachment.value ?? undefined)
    }
    dialog.value = false
  } finally {
    saving.value = false
  }
}

const deleteDialog = ref(false)
const deletingItem = ref<News | null>(null)
const deleting = ref(false)

function openDelete(n: News) {
  deletingItem.value = n
  deleteDialog.value = true
}

async function handleDelete() {
  if (!deletingItem.value) return
  deleting.value = true
  try {
    await store.remove(deletingItem.value.id)
    deleteDialog.value = false
  } finally {
    deleting.value = false
  }
}

const fmt = (ts: any) => ts?.toDate ? dayjs(ts.toDate()).format('D MMM YYYY') : ''
</script>

<template>
  <div class="manage-screen">
    <!-- Page header -->
    <div class="manage-header">
      <BackBtn />
      <h1 class="manage-title">Noticias</h1>
      <button class="add-btn" @click="openCreate">
        <VIcon icon="mdi-plus" size="20" color="white" />
        <span>Publicar</span>
      </button>
    </div>

    <div class="manage-body">
      <LoadingSpinner v-if="store.loading" />

      <EmptyState
        v-else-if="!store.items.length"
        icon="mdi-newspaper-variant-outline"
        message="No hay noticias publicadas"
      />

      <div v-else class="items-card">
        <div
          v-for="(n, idx) in store.items"
          :key="n.id"
          class="item-row"
          :class="{ 'item-row--last': idx === store.items.length - 1 }"
        >
          <div class="item-icon">
            <VIcon
              :icon="n.attachmentType === 'pdf' ? 'mdi-file-pdf-box' : n.hasAttachment ? 'mdi-file-image-outline' : 'mdi-newspaper-variant-outline'"
              size="18"
              color="#4F35E8"
            />
          </div>
          <div class="item-info">
            <span class="item-title">{{ n.title }}</span>
            <span class="item-date">{{ fmt(n.publishedAt) }}</span>
          </div>
          <div class="item-actions">
            <button class="action-btn" @click="openEdit(n)">
              <VIcon icon="mdi-pencil-outline" size="16" />
            </button>
            <button class="action-btn action-btn--danger" @click="openDelete(n)">
              <VIcon icon="mdi-trash-can-outline" size="16" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create / Edit dialog -->
    <VDialog v-model="dialog" max-width="520" :persistent="saving">
      <VCard rounded="xl">
        <div class="dialog-header">
          <span class="dialog-title">{{ editingId ? 'Editar noticia' : 'Nueva noticia' }}</span>
          <button class="dialog-close" @click="dialog = false">
            <VIcon icon="mdi-close" size="18" />
          </button>
        </div>
        <div class="dialog-body">
          <VTextField
            v-model="form.title"
            label="Título *"
            class="mb-3"
          />
          <VTextarea
            v-model="form.body"
            label="Contenido *"
            rows="5"
            auto-grow
            class="mb-3"
          />

          <input ref="fileInput" type="file" accept="image/*,application/pdf" style="display:none" @change="onFileChange" />
          <button class="attach-btn" @click="($refs.fileInput as HTMLElement).click()">
            <VIcon icon="mdi-paperclip" size="16" />
            {{ attachment ? attachment.name : attachmentPreview ? 'Cambiar adjunto' : 'Adjuntar imagen o PDF' }}
          </button>

          <img
            v-if="attachmentPreview && (!attachment || attachment.type !== 'application/pdf')"
            :src="attachmentPreview"
            class="preview-img"
            alt="Vista previa"
          />
          <div v-if="attachment?.type === 'application/pdf'" class="pdf-badge">
            <VIcon icon="mdi-file-pdf-box" size="16" color="#DC2626" />
            {{ attachment.name }}
          </div>
        </div>
        <div class="dialog-footer">
          <button class="footer-btn footer-btn--secondary" @click="dialog = false">Cancelar</button>
          <button
            class="footer-btn footer-btn--primary"
            :disabled="saving || !form.title.trim() || !form.body.trim()"
            @click="handleSave"
          >
            <span v-if="!saving">{{ editingId ? 'Guardar' : 'Publicar' }}</span>
            <span v-else class="btn-spinner" />
          </button>
        </div>
      </VCard>
    </VDialog>

    <!-- Delete dialog -->
    <VDialog v-model="deleteDialog" max-width="360" :persistent="deleting">
      <VCard rounded="xl">
        <div class="dialog-body">
          <div class="delete-icon-wrap">
            <VIcon icon="mdi-trash-can-outline" size="28" color="#DC2626" />
          </div>
          <p class="delete-title">¿Eliminar noticia?</p>
          <p class="delete-subtitle">
            "<strong>{{ deletingItem?.title }}</strong>" se eliminará permanentemente.
          </p>
        </div>
        <div class="dialog-footer">
          <button class="footer-btn footer-btn--secondary" @click="deleteDialog = false">Cancelar</button>
          <button
            class="footer-btn footer-btn--danger"
            :disabled="deleting"
            @click="handleDelete"
          >
            <span v-if="!deleting">Eliminar</span>
            <span v-else class="btn-spinner" />
          </button>
        </div>
      </VCard>
    </VDialog>
  </div>
</template>

<style scoped>
.manage-screen { min-height: 100dvh; background: var(--color-bg); }

.manage-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 12px;
  position: sticky;
  top: 57px; /* below admin layout header */
  background: var(--color-bg);
  z-index: 5;
}

.manage-title {
  font-size: 22px;
  font-weight: 800;
  color: var(--color-text-primary);
  letter-spacing: -0.4px;
  margin: 0;
}

.add-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--color-admin);
  color: white;
  border: none;
  border-radius: 9999px;
  padding: 8px 16px 8px 12px;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: opacity 0.15s;
}
.add-btn:active { opacity: 0.85; }

.manage-body { padding: 0 16px 24px; }

/* Items list */
.items-card {
  background: var(--color-surface);
  border-radius: 20px;
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.item-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--color-border-light);
}
.item-row--last { border-bottom: none; }

.item-icon {
  width: 38px;
  height: 38px;
  background: var(--color-primary-soft);
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.item-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.item-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-date {
  font-size: 11px;
  color: var(--color-text-tertiary);
}

.item-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.action-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: var(--color-surface-2);
  border-radius: 9px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  transition: background 0.12s;
}
.action-btn:active { background: var(--color-border); }
.action-btn--danger { color: #DC2626; }
.action-btn--danger:active { background: #FEE2E2; }

/* Dialog */
.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 20px 0;
}

.dialog-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.dialog-close {
  width: 28px;
  height: 28px;
  border: none;
  background: var(--color-surface-2);
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
}

.dialog-body { padding: 16px 20px; }

.attach-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  background: var(--color-surface-2);
  border: 1.5px dashed var(--color-border);
  border-radius: 12px;
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: border-color 0.15s;
}
.attach-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }

.preview-img {
  width: 100%;
  height: 140px;
  object-fit: cover;
  border-radius: 12px;
  display: block;
  margin-top: 10px;
}

.pdf-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #FEE2E2;
  border-radius: 10px;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 500;
  color: #B91C1C;
  margin-top: 10px;
}

.dialog-footer {
  display: flex;
  gap: 10px;
  padding: 0 20px 20px;
}

.footer-btn {
  flex: 1;
  height: 46px;
  border: none;
  border-radius: 9999px;
  font-size: 14px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.15s;
}
.footer-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.footer-btn--secondary { background: var(--color-surface-2); color: var(--color-text-primary); }
.footer-btn--primary { background: var(--color-primary); color: white; }
.footer-btn--danger { background: #EF4444; color: white; }

/* Delete dialog content */
.delete-icon-wrap {
  width: 56px;
  height: 56px;
  background: #FEE2E2;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
}

.delete-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--color-text-primary);
  text-align: center;
  margin: 0 0 8px;
}

.delete-subtitle {
  font-size: 14px;
  color: var(--color-text-secondary);
  text-align: center;
  margin: 0;
  line-height: 1.5;
}

.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.4);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: block;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
