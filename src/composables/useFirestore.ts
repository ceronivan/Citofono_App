import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  serverTimestamp,
  type QueryConstraint,
} from 'firebase/firestore'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth.store'

export function useFirestore() {
  const authStore = useAuthStore()

  function complexCol(col: string) {
    return collection(db, 'complexes', authStore.complexId!, col)
  }

  function complexDoc(col: string, id: string) {
    return doc(db, 'complexes', authStore.complexId!, col, id)
  }

  async function getAll<T>(colName: string, constraints: QueryConstraint[] = []): Promise<T[]> {
    const ref = complexCol(colName)
    const q = constraints.length ? query(ref, ...constraints) : query(ref)
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() }) as T)
  }

  async function getOne<T>(colName: string, id: string): Promise<T | null> {
    const snap = await getDoc(complexDoc(colName, id))
    if (!snap.exists()) return null
    return { id: snap.id, ...snap.data() } as T
  }

  async function create<T extends object>(colName: string, data: T): Promise<string> {
    const ref = complexCol(colName)
    const docRef = await addDoc(ref, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return docRef.id
  }

  async function update<T extends object>(colName: string, id: string, data: Partial<T>): Promise<void> {
    await updateDoc(complexDoc(colName, id), {
      ...data,
      updatedAt: serverTimestamp(),
    })
  }

  async function remove(colName: string, id: string): Promise<void> {
    await deleteDoc(complexDoc(colName, id))
  }

  return { getAll, getOne, create, update, remove, complexCol, complexDoc }
}
