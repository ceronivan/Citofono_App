import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  collection, query, where, orderBy, getDocs,
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/firebase'
import { useAuthStore } from './auth.store'
import { useStorage } from '@/composables/useStorage'
import type { Vehicle } from '@/types'

type VehiclePayload = Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>

export const useVehiclesStore = defineStore('vehicles', () => {
  const authStore = useAuthStore()
  const { uploadFile } = useStorage()
  const items = ref<Vehicle[]>([])
  const loading = ref(false)

  function col() {
    return collection(db, 'complexes', authStore.complexId!, 'vehicles')
  }

  async function fetchMine() {
    loading.value = true
    try {
      const q = query(col(), where('ownerId', '==', authStore.userData!.id), orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)
      items.value = snap.docs.map(d => ({ id: d.id, ...d.data() }) as Vehicle)
    } finally {
      loading.value = false
    }
  }

  async function fetchByApartment(apt: string): Promise<Vehicle[]> {
    const q = query(col(), where('apartmentNumber', '==', apt))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Vehicle)
  }

  async function add(payload: VehiclePayload, photo?: File) {
    let photoUrl = payload.photoUrl ?? ''
    if (photo) {
      photoUrl = await uploadFile(photo, `vehicles/${Date.now()}`)
    }
    await addDoc(col(), { ...payload, photoUrl, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
    await fetchMine()
  }

  async function update(id: string, payload: Partial<VehiclePayload>, photo?: File) {
    let photoUrl = payload.photoUrl
    if (photo) {
      photoUrl = await uploadFile(photo, `vehicles/${id}`)
    }
    const ref = doc(db, 'complexes', authStore.complexId!, 'vehicles', id)
    await updateDoc(ref, { ...payload, ...(photoUrl ? { photoUrl } : {}), updatedAt: serverTimestamp() })
    await fetchMine()
  }

  async function remove(id: string) {
    await deleteDoc(doc(db, 'complexes', authStore.complexId!, 'vehicles', id))
    items.value = items.value.filter(v => v.id !== id)
  }

  return { items, loading, fetchMine, fetchByApartment, add, update, remove }
})
