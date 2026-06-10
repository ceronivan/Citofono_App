import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  collection, query, where, orderBy, getDocs, getDoc, doc,
  addDoc, updateDoc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/firebase'
import { useAuthStore } from './auth.store'
import { useStorage } from '@/composables/useStorage'
import type { DamageReport, TicketStatus } from '@/types'

export const useDamageReportsStore = defineStore('damageReports', () => {
  const authStore = useAuthStore()
  const { uploadFile } = useStorage()
  const items = ref<DamageReport[]>([])
  const current = ref<DamageReport | null>(null)
  const loading = ref(false)

  function col() {
    return collection(db, 'complexes', authStore.complexId!, 'damageReports')
  }

  async function fetchMine() {
    loading.value = true
    try {
      const q = query(col(), where('authorId', '==', authStore.userData!.id), orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)
      items.value = snap.docs.map(d => ({ id: d.id, ...d.data() }) as DamageReport)
    } finally {
      loading.value = false
    }
  }

  async function fetchAll() {
    loading.value = true
    try {
      const snap = await getDocs(query(col(), orderBy('createdAt', 'desc')))
      items.value = snap.docs.map(d => ({ id: d.id, ...d.data() }) as DamageReport)
    } finally {
      loading.value = false
    }
  }

  async function fetchOne(id: string) {
    const snap = await getDoc(doc(db, 'complexes', authStore.complexId!, 'damageReports', id))
    current.value = snap.exists() ? ({ id: snap.id, ...snap.data() } as DamageReport) : null
  }

  async function create(title: string, description: string, images: File[]) {
    const urls = await Promise.all(images.map(f => uploadFile(f, `damage/${Date.now()}-${f.name}`)))
    await addDoc(col(), {
      authorId: authStore.userData!.id,
      apartmentNumber: authStore.userData!.apartmentNumber,
      title, description,
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
    await updateDoc(doc(db, 'complexes', authStore.complexId!, 'damageReports', id), {
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
