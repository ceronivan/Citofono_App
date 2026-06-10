import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  collection, query, where, orderBy, getDocs, getDoc, doc,
  addDoc, updateDoc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/firebase'
import { useAuthStore } from './auth.store'
import { useStorage } from '@/composables/useStorage'
import type { PQR, PQRCategory, TicketStatus } from '@/types'

export const usePQRsStore = defineStore('pqrs', () => {
  const authStore = useAuthStore()
  const { uploadFile } = useStorage()
  const items = ref<PQR[]>([])
  const current = ref<PQR | null>(null)
  const loading = ref(false)

  function col() {
    return collection(db, 'complexes', authStore.complexId!, 'pqrs')
  }

  async function fetchMine() {
    loading.value = true
    try {
      const q = query(col(), where('authorId', '==', authStore.userData!.id), orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)
      items.value = snap.docs.map(d => ({ id: d.id, ...d.data() }) as PQR)
    } finally {
      loading.value = false
    }
  }

  async function fetchAll() {
    loading.value = true
    try {
      const snap = await getDocs(query(col(), orderBy('createdAt', 'desc')))
      items.value = snap.docs.map(d => ({ id: d.id, ...d.data() }) as PQR)
    } finally {
      loading.value = false
    }
  }

  async function fetchOne(id: string) {
    const snap = await getDoc(doc(db, 'complexes', authStore.complexId!, 'pqrs', id))
    current.value = snap.exists() ? ({ id: snap.id, ...snap.data() } as PQR) : null
  }

  async function create(category: PQRCategory, title: string, description: string, images: File[]) {
    const urls = await Promise.all(images.map(f => uploadFile(f, `pqrs/${Date.now()}-${f.name}`)))
    await addDoc(col(), {
      authorId: authStore.userData!.id,
      apartmentNumber: authStore.userData!.apartmentNumber,
      category, title, description,
      attachmentUrls: urls,
      status: 'pending',
      adminResponse: '',
      resolvedAt: null,
      resolvedBy: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    await fetchMine()
  }

  async function resolve(id: string, adminResponse: string) {
    await updateDoc(doc(db, 'complexes', authStore.complexId!, 'pqrs', id), {
      status: 'resolved' as TicketStatus,
      adminResponse,
      resolvedAt: serverTimestamp(),
      resolvedBy: authStore.userData!.id,
      updatedAt: serverTimestamp(),
    })
    await fetchAll()
  }

  return { items, current, loading, fetchMine, fetchAll, fetchOne, create, resolve }
})
