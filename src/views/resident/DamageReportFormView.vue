<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDamageReportsStore } from '@/stores/damage-reports.store'

const router = useRouter()
const store = useDamageReportsStore()
const loading = ref(false)
const images = ref<File[]>([])
const previews = ref<string[]>([])
const form = ref({ title: '', description: '' })

function onImageAdd(e: Event) {
  const files = Array.from((e.target as HTMLInputElement).files ?? [])
  images.value.push(...files)
  files.forEach(f => previews.value.push(URL.createObjectURL(f)))
}

async function handleSave() {
  loading.value = true
  try {
    await store.create(form.value.title, form.value.description, images.value)
    router.push('/damage-reports')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <ScreenHeader title="Reportar Daño" />
    <VContainer class="py-4">
      <VTextField v-model="form.title" label="Título" class="mb-3" />
      <VTextarea v-model="form.description" label="Descripción" rows="4" class="mb-4" />
      <div class="d-flex gap-2 flex-wrap mb-3">
        <VImg v-for="(p, i) in previews" :key="i" :src="p" width="96" height="96" cover rounded="lg" style="border: 1px solid var(--color-border);" />
        <label class="d-flex align-center justify-center" style="width:96px;height:96px;border:2px dashed var(--color-border);border-radius:10px;cursor:pointer;" for="damage-images">
          <VIcon color="grey">mdi-plus</VIcon>
        </label>
      </div>
      <input id="damage-images" type="file" accept="image/*" multiple class="d-none" @change="onImageAdd" />
      <div class="d-flex gap-3 mt-2">
        <BtnSecondary @click="router.back()">Cancelar</BtnSecondary>
        <BtnPrimary :loading="loading" @click="handleSave">Guardar</BtnPrimary>
      </div>
    </VContainer>
  </div>
</template>
