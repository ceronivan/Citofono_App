import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  collection, query, where, orderBy, getDocs,
  addDoc, updateDoc, doc, serverTimestamp, Timestamp,
} from 'firebase/firestore'
import { db } from '@/firebase'
import { useAuthStore } from './auth.store'
import { useStorage } from '@/composables/useStorage'
import type { Mail, MailType } from '@/types'

export const useMailStore = defineStore('mail', () => {
  const authStore = useAuthStore()
  const { uploadFile } = useStorage()
  const items = ref<Mail[]>([])
  const loading = ref(false)

  function col() {
    return collection(db, 'complexes', authStore.complexId!, 'mail')
  }

  async function fetchMine() {
    loading.value = true
    try {
      const q = query(col(), where('apartmentNumber', '==', authStore.userData!.apartmentNumber), orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)
      items.value = snap.docs.map(d => ({ id: d.id, ...d.data() }) as Mail)
    } finally {
      loading.value = false
    }
  }

  async function fetchAll() {
    loading.value = true
    try {
      const snap = await getDocs(query(col(), orderBy('createdAt', 'desc')))
      items.value = snap.docs.map(d => ({ id: d.id, ...d.data() }) as Mail)
    } finally {
      loading.value = false
    }
  }

  async function register(
    apartmentNumber: string,
    residentId: string,
    description: string,
    type: MailType,
    photo: File,
    sender?: string,
  ) {
    const photoUrl = await uploadFile(photo, `mail/${Date.now()}`)
    await addDoc(col(), {
      registeredBy: authStore.userData!.id,
      apartmentNumber,
      residentId,
      description,
      type,
      sender: sender ?? '',
      photoUrl,
      status: 'pending',
      deliveredAt: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }

  async function markDelivered(id: string) {
    const expiry = Timestamp.fromDate(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000))
    await updateDoc(doc(db, 'complexes', authStore.complexId!, 'mail', id), {
      status: 'delivered',
      deliveredAt: serverTimestamp(),
      residentConfirmedExpiry: expiry,
      updatedAt: serverTimestamp(),
    })
    items.value = items.value.map(m =>
      m.id === id ? { ...m, status: 'delivered' as const, residentConfirmedExpiry: expiry } : m,
    )
  }

  async function confirmReceipt(id: string) {
    await updateDoc(doc(db, 'complexes', authStore.complexId!, 'mail', id), {
      status: 'confirmed',
      residentConfirmedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    items.value = items.value.map(m =>
      m.id === id ? { ...m, status: 'confirmed' as const } : m,
    )
  }

  return { items, loading, fetchMine, fetchAll, register, markDelivered, confirmReceipt }
})
