import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  collection, query, where, orderBy, getDocs,
  addDoc, updateDoc, doc, serverTimestamp, Timestamp,
} from 'firebase/firestore'
import { db } from '@/firebase'
import { useAuthStore } from './auth.store'
import { useStorage } from '@/composables/useStorage'
import type { Visit, VisitType } from '@/types'

export const useVisitsStore = defineStore('visits', () => {
  const authStore = useAuthStore()
  const { uploadFile } = useStorage()
  const items = ref<Visit[]>([])
  const loading = ref(false)

  function col() {
    return collection(db, 'complexes', authStore.complexId!, 'visits')
  }

  async function fetchMine() {
    loading.value = true
    try {
      const q = query(col(), where('apartmentNumber', '==', authStore.userData!.apartmentNumber), orderBy('entryTime', 'desc'))
      const snap = await getDocs(q)
      items.value = snap.docs.map(d => ({ id: d.id, ...d.data() }) as Visit)
    } finally {
      loading.value = false
    }
  }

  async function fetchAll() {
    loading.value = true
    try {
      const q = query(col(), orderBy('entryTime', 'desc'))
      const snap = await getDocs(q)
      items.value = snap.docs.map(d => ({ id: d.id, ...d.data() }) as Visit)
    } finally {
      loading.value = false
    }
  }

  async function register(
    type: VisitType,
    data: Partial<Visit>,
    photo?: File,
  ) {
    let photoKey = type === 'pedestrian' ? 'visitorPhotoUrl' : 'vehiclePhotoUrl'
    let photoUrl = ''
    if (photo) {
      photoUrl = await uploadFile(photo, `visits/${Date.now()}`)
    }
    await addDoc(col(), {
      ...data,
      type,
      guardId: authStore.userData!.id,
      [photoKey]: photoUrl,
      entryTime: serverTimestamp(),
      exitTime: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }

  async function registerExit(id: string, entryTime: Timestamp) {
    const now = Timestamp.now()
    const duration = Math.round((now.toMillis() - entryTime.toMillis()) / 60000)
    await updateDoc(doc(db, 'complexes', authStore.complexId!, 'visits', id), {
      exitTime: serverTimestamp(),
      duration,
      updatedAt: serverTimestamp(),
    })
  }

  return { items, loading, fetchMine, fetchAll, register, registerExit }
})
