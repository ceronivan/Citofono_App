import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  collection, query, where, orderBy, getDocs,
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp, Timestamp,
} from 'firebase/firestore'
import { db } from '@/firebase'
import { useAuthStore } from './auth.store'
import { useStorage } from '@/composables/useStorage'
import type { Authorization } from '@/types'

type AuthPayload = Omit<Authorization, 'id' | 'createdAt' | 'updatedAt'>

export const useAuthorizationsStore = defineStore('authorizations', () => {
  const authStore = useAuthStore()
  const { uploadFile } = useStorage()
  const items = ref<Authorization[]>([])
  const loading = ref(false)

  function col() {
    return collection(db, 'complexes', authStore.complexId!, 'authorizations')
  }

  async function fetchMine() {
    loading.value = true
    try {
      const q = query(col(), where('grantedBy', '==', authStore.userData!.id), orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)
      items.value = snap.docs.map(d => ({ id: d.id, ...d.data() }) as Authorization)
    } finally {
      loading.value = false
    }
  }

  // For guard: active authorizations by apartment
  async function fetchActiveByApartment(apt: string): Promise<Authorization[]> {
    const now = Timestamp.now()
    const q = query(col(), where('apartmentNumber', '==', apt), where('validUntil', '>=', now))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Authorization)
  }

  async function add(payload: AuthPayload, photo?: File) {
    let photoUrl = payload.person.photoUrl ?? ''
    if (photo) {
      photoUrl = await uploadFile(photo, `authorizations/${Date.now()}`)
    }
    await addDoc(col(), {
      ...payload,
      person: { ...payload.person, photoUrl },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    await fetchMine()
  }

  async function update(id: string, payload: Partial<AuthPayload>, photo?: File) {
    let updatedPerson = payload.person
    if (photo && updatedPerson) {
      const photoUrl = await uploadFile(photo, `authorizations/${id}`)
      updatedPerson = { ...updatedPerson, photoUrl }
    }
    const ref = doc(db, 'complexes', authStore.complexId!, 'authorizations', id)
    await updateDoc(ref, { ...payload, ...(updatedPerson ? { person: updatedPerson } : {}), updatedAt: serverTimestamp() })
    await fetchMine()
  }

  async function remove(id: string) {
    await deleteDoc(doc(db, 'complexes', authStore.complexId!, 'authorizations', id))
    items.value = items.value.filter(a => a.id !== id)
  }

  return { items, loading, fetchMine, fetchActiveByApartment, add, update, remove }
})
