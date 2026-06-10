<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useCamerasStore } from '@/stores/cameras.store'
import { useConfirmStore } from '@/stores/confirm.store'
import CameraGrid from '@/components/shared/CameraGrid.vue'
import type { Camera } from '@/types'

const store = useCamerasStore()
const confirm = useConfirmStore()

async function handleRemove(cam: Camera) {
  const ok = await confirm.ask({
    title: '¿Eliminar cámara?',
    message: `${cam.name} (${cam.location}) se quitará del monitoreo.`,
  })
  if (ok) await store.remove(cam.id)
}
onMounted(() => store.fetchAll())

const dialog = ref(false)
const saving = ref(false)
const editing = ref<Camera | null>(null)

const name = ref('')
const location = ref('')
const streamUrl = ref('')
const active = ref(true)

// Streams de demostración (la integración CCTV real se configura por edificio)
const DEMO_STREAMS = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
]

function openCreate() {
  editing.value = null
  name.value = ''
  location.value = ''
  streamUrl.value = DEMO_STREAMS[store.items.length % DEMO_STREAMS.length]
  active.value = true
  dialog.value = true
}

function openEdit(cam: Camera) {
  editing.value = cam
  name.value = cam.name
  location.value = cam.location
  streamUrl.value = cam.streamUrl
  active.value = cam.active
  dialog.value = true
}

const canSave = computed(() => name.value.trim() && streamUrl.value.trim())

async function save() {
  saving.value = true
  try {
    const payload = {
      name: name.value.trim(),
      location: location.value.trim(),
      streamUrl: streamUrl.value.trim(),
      active: active.value,
    }
    if (editing.value) await store.update(editing.value.id, payload)
    else await store.add(payload)
    dialog.value = false
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <ScreenHeader title="Cámaras de seguridad" />
    <VContainer class="py-4">
      <div class="cam-banner">
        <VIcon icon="mdi-information-outline" size="16" />
        <span>Vista de demostración — los streams reales del CCTV se conectan al configurar el hardware del edificio.</span>
      </div>

      <BtnPrimary icon="mdi-plus" class="mb-5" @click="openCreate">Agregar cámara</BtnPrimary>

      <LoadingSpinner v-if="store.loading" />
      <EmptyState v-else-if="!store.items.length" icon="mdi-cctv" message="No hay cámaras configuradas" />
      <CameraGrid v-else :cameras="store.items" manage @edit="openEdit" @remove="handleRemove" />
    </VContainer>

    <VDialog v-model="dialog" max-width="440">
      <VCard rounded="xl" class="pa-5">
        <VCardTitle class="px-0 pt-0 font-weight-bold">
          {{ editing ? 'Editar cámara' : 'Nueva cámara' }}
        </VCardTitle>
        <VTextField v-model="name" label="Nombre" placeholder="CAM 01 — Lobby" variant="outlined" density="comfortable" hide-details class="mb-3" />
        <VTextField v-model="location" label="Ubicación" placeholder="Entrada principal" variant="outlined" density="comfortable" hide-details class="mb-3" />
        <VTextField v-model="streamUrl" label="URL del stream" variant="outlined" density="comfortable" hide-details class="mb-2" />
        <p class="text-caption text-medium-emphasis mb-3">
          Acepta MP4/HLS. Por ahora usa videos de demostración.
        </p>
        <VSwitch v-model="active" label="Cámara activa" color="primary" hide-details class="mb-4" />
        <div class="d-flex" style="gap: 10px">
          <BtnSecondary @click="dialog = false">Cancelar</BtnSecondary>
          <BtnPrimary :loading="saving" :disabled="!canSave" @click="save">Guardar</BtnPrimary>
        </div>
      </VCard>
    </VDialog>
  </div>
</template>

<style scoped>
.cam-banner {
  display: flex; align-items: flex-start; gap: 8px;
  background: var(--color-info-soft); color: #1D4ED8;
  border-radius: 12px; padding: 10px 14px;
  font-size: 12px; line-height: 1.45;
  margin-bottom: 16px;
}
</style>
