import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth.store'
import type { User } from '@/types'

export function useResidentLookup() {
  const authStore = useAuthStore()

  async function findByApartment(apartmentNumber: string): Promise<User | null> {
    if (!apartmentNumber.trim()) return null
    const q = query(
      collection(db, 'users'),
      where('complexId', '==', authStore.complexId),
      where('apartmentNumber', '==', apartmentNumber.trim()),
      where('role', '==', 'resident'),
    )
    const snap = await getDocs(q)
    if (snap.empty) return null
    return { id: snap.docs[0].id, ...snap.docs[0].data() } as User
  }

  return { findByApartment }
}
