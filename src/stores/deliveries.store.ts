import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  collection, query, where, orderBy, getDocs,
  addDoc, updateDoc, doc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/firebase'
import { useAuthStore } from './auth.store'
import type { Delivery, DeliveryStatus } from '@/types'

type DeliveryPayload = Omit<Delivery, 'id' | 'createdAt' | 'updatedAt' | 'status'>

export const useDeliveriesStore = defineStore('deliveries', () => {
  const authStore = useAuthStore()
  const items = ref<Delivery[]>([])
  const loading = ref(false)

  const expected = computed(() => items.value.filter((d) => d.status === 'expected'))

  function col() {
    return collection(db, 'complexes', authStore.complexId!, 'deliveries')
  }

  async function fetchMine() {
    loading.value = true
    try {
      const q = query(col(), where('residentId', '==', authStore.userData!.id), orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)
      items.value = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Delivery)
    } finally {
      loading.value = false
    }
  }

  /** Vista del portero: todas las entregas esperadas hoy. */
  async function fetchExpected() {
    loading.value = true
    try {
      const q = query(col(), where('status', '==', 'expected'), orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)
      items.value = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Delivery)
    } finally {
      loading.value = false
    }
  }

  async function add(payload: DeliveryPayload) {
    await addDoc(col(), {
      ...payload,
      status: 'expected' satisfies DeliveryStatus,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    await fetchMine()
  }

  async function cancel(id: string) {
    await updateDoc(doc(db, 'complexes', authStore.complexId!, 'deliveries', id), {
      status: 'cancelled' satisfies DeliveryStatus,
      updatedAt: serverTimestamp(),
    })
    const d = items.value.find((x) => x.id === id)
    if (d) d.status = 'cancelled'
  }

  /** Portero confirma entrega tras verificar el código. */
  async function markDelivered(id: string, notes?: string) {
    await updateDoc(doc(db, 'complexes', authStore.complexId!, 'deliveries', id), {
      status: 'delivered' satisfies DeliveryStatus,
      deliveredAt: serverTimestamp(),
      deliveredBy: authStore.userData!.id,
      ...(notes ? { notes } : {}),
      updatedAt: serverTimestamp(),
    })
    const d = items.value.find((x) => x.id === id)
    if (d) d.status = 'delivered'
  }

  return { items, loading, expected, fetchMine, fetchExpected, add, cancel, markDelivered }
})
