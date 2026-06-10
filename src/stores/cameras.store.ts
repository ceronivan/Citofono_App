import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  collection, query, orderBy, getDocs,
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/firebase'
import { useAuthStore } from './auth.store'
import type { Camera } from '@/types'

type CameraPayload = Omit<Camera, 'id' | 'createdAt' | 'updatedAt'>

export const useCamerasStore = defineStore('cameras', () => {
  const authStore = useAuthStore()
  const items = ref<Camera[]>([])
  const loading = ref(false)

  function col() {
    return collection(db, 'complexes', authStore.complexId!, 'cameras')
  }

  async function fetchAll() {
    loading.value = true
    try {
      const snap = await getDocs(query(col(), orderBy('name')))
      items.value = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Camera)
    } finally {
      loading.value = false
    }
  }

  async function add(payload: CameraPayload) {
    await addDoc(col(), { ...payload, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
    await fetchAll()
  }

  async function update(id: string, payload: Partial<CameraPayload>) {
    await updateDoc(doc(db, 'complexes', authStore.complexId!, 'cameras', id), {
      ...payload,
      updatedAt: serverTimestamp(),
    })
    await fetchAll()
  }

  async function remove(id: string) {
    await deleteDoc(doc(db, 'complexes', authStore.complexId!, 'cameras', id))
    items.value = items.value.filter((c) => c.id !== id)
  }

  return { items, loading, fetchAll, add, update, remove }
})
