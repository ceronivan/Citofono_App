<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { usePQRsStore } from '@/stores/pqrs.store'
import type { PQRCategory } from '@/types'

const router = useRouter()
const store = usePQRsStore()
const loading = ref(false)
const images = ref<File[]>([])
const previews = ref<string[]>([])

const form = ref({
  category: '' as PQRCategory,
  title: '',
  description: '',
})

const categories = [
  { value: 'noise', title: 'Ruido' },
  { value: 'damage', title: 'Daños' },
  { value: 'services', title: 'Servicios' },
  { value: 'security', title: 'Seguridad' },
  { value: 'admin', title: 'Administración' },
  { value: 'other', title: 'Otro' },
]

function onImageAdd(e: Event) {
  const files = Array.from((e.target as HTMLInputElement).files ?? [])
  images.value.push(...files)
  files.forEach(f => previews.value.push(URL.createObjectURL(f)))
}

async function handleSave() {
  loading.value = true
  try {
    await store.create(form.value.category, form.value.title, form.value.description, images.value)
    router.push('/pqrs')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <ScreenHeader title="Crear PQR" />
    <VContainer class="py-4">
      <VSelect v-model="form.category" label="Categoría" :items="categories" item-title="title" item-value="value" class="mb-3" />
      <VTextField v-model="form.title" label="Título" class="mb-3" />
      <VTextarea v-model="form.description" label="Descripción" rows="4" class="mb-4" />

      <!-- Image grid -->
      <div class="d-flex gap-2 flex-wrap mb-3">
        <VImg
          v-for="(p, i) in previews"
          :key="i"
          :src="p"
          width="96" height="96"
          cover
          rounded="lg"
          style="border: 1px solid var(--color-border);"
        />
        <label
          class="d-flex align-center justify-center"
          style="width:96px;height:96px;border:2px dashed var(--color-border);border-radius:10px;cursor:pointer;"
          for="pqr-images"
        >
          <VIcon color="grey">mdi-plus</VIcon>
        </label>
      </div>
      <input id="pqr-images" type="file" accept="image/*" multiple class="d-none" @change="onImageAdd" />

      <div class="d-flex gap-3 mt-2">
        <BtnSecondary @click="router.back()">Cancelar</BtnSecondary>
        <BtnPrimary :loading="loading" @click="handleSave">Guardar</BtnPrimary>
      </div>
    </VContainer>
  </div>
</template>
