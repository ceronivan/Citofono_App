import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  collection, query, orderBy, getDocs,
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/firebase'
import { useAuthStore } from './auth.store'
import type { MaintenanceTask, MaintenanceStatus } from '@/types'

type MaintenancePayload = Omit<MaintenanceTask, 'id' | 'createdAt' | 'updatedAt'>

export const useMaintenanceStore = defineStore('maintenance', () => {
  const authStore = useAuthStore()
  const items = ref<MaintenanceTask[]>([])
  const loading = ref(false)

  const upcoming = computed(() =>
    items.value.filter((m) => m.status === 'scheduled' || m.status === 'in_progress'),
  )

  function col() {
    return collection(db, 'complexes', authStore.complexId!, 'maintenances')
  }

  async function fetchAll() {
    loading.value = true
    try {
      const snap = await getDocs(query(col(), orderBy('scheduledDate', 'asc')))
      items.value = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as MaintenanceTask)
    } finally {
      loading.value = false
    }
  }

  async function add(payload: MaintenancePayload) {
    await addDoc(col(), { ...payload, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
    await fetchAll()
  }

  async function update(id: string, payload: Partial<MaintenancePayload>) {
    await updateDoc(doc(db, 'complexes', authStore.complexId!, 'maintenances', id), {
      ...payload,
      updatedAt: serverTimestamp(),
    })
    await fetchAll()
  }

  async function setStatus(id: string, status: MaintenanceStatus) {
    await update(id, { status })
  }

  async function remove(id: string) {
    await deleteDoc(doc(db, 'complexes', authStore.complexId!, 'maintenances', id))
    items.value = items.value.filter((m) => m.id !== id)
  }

  return { items, loading, upcoming, fetchAll, add, update, setStatus, remove }
})
