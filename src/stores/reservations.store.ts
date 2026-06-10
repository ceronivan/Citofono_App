import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  collection, query, where, orderBy, getDocs,
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/firebase'
import { useAuthStore } from './auth.store'
import type { Reservation, ReservationStatus, CommonArea } from '@/types'

type ReservationPayload = Omit<Reservation, 'id' | 'createdAt' | 'updatedAt'>

export const useReservationsStore = defineStore('reservations', () => {
  const authStore = useAuthStore()
  const items = ref<Reservation[]>([])
  const loading = ref(false)

  function col() {
    return collection(db, 'complexes', authStore.complexId!, 'reservations')
  }

  async function fetchMine() {
    loading.value = true
    try {
      const q = query(col(), where('residentId', '==', authStore.userData!.id), orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)
      items.value = snap.docs.map(d => ({ id: d.id, ...d.data() }) as Reservation)
    } finally {
      loading.value = false
    }
  }

  async function fetchAll() {
    loading.value = true
    try {
      const q = query(col(), orderBy('startDateTime', 'desc'))
      const snap = await getDocs(q)
      items.value = snap.docs.map(d => ({ id: d.id, ...d.data() }) as Reservation)
    } finally {
      loading.value = false
    }
  }

  async function add(payload: ReservationPayload) {
    await addDoc(col(), {
      ...payload,
      status: payload.status ?? 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    await fetchMine()
  }

  async function update(id: string, payload: Partial<ReservationPayload>) {
    await updateDoc(doc(db, 'complexes', authStore.complexId!, 'reservations', id), {
      ...payload, updatedAt: serverTimestamp(),
    })
    await fetchMine()
  }

  async function updateStatus(id: string, status: ReservationStatus, adminNotes?: string) {
    await updateDoc(doc(db, 'complexes', authStore.complexId!, 'reservations', id), {
      status, ...(adminNotes ? { adminNotes } : {}), updatedAt: serverTimestamp(),
    })
    await fetchAll()
  }

  async function remove(id: string) {
    await deleteDoc(doc(db, 'complexes', authStore.complexId!, 'reservations', id))
    items.value = items.value.filter(r => r.id !== id)
  }

  return { items, loading, fetchMine, fetchAll, add, update, updateStatus, remove }
})
