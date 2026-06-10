import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  collection, query, where, orderBy, getDocs,
  updateDoc, doc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/firebase'
import { useAuthStore } from './auth.store'
import type { AppNotification } from '@/types'

export const useNotificationsStore = defineStore('notifications', () => {
  const authStore = useAuthStore()
  const items = ref<AppNotification[]>([])
  const loading = ref(false)

  const unreadCount = computed(() => items.value.filter(n => !n.isRead).length)

  function col() {
    return collection(db, 'complexes', authStore.complexId!, 'notifications')
  }

  async function fetchMine() {
    loading.value = true
    try {
      const q = query(
        col(),
        where('recipientId', '==', authStore.userData!.id),
        orderBy('createdAt', 'desc'),
      )
      const snap = await getDocs(q)
      items.value = snap.docs.map(d => ({ id: d.id, ...d.data() }) as AppNotification)
    } finally {
      loading.value = false
    }
  }

  async function markRead(id: string) {
    await updateDoc(doc(db, 'complexes', authStore.complexId!, 'notifications', id), {
      isRead: true,
      readAt: serverTimestamp(),
    })
    items.value = items.value.map(n => n.id === id ? { ...n, isRead: true } : n)
  }

  async function markAllRead() {
    const unread = items.value.filter(n => !n.isRead)
    await Promise.all(unread.map(n => markRead(n.id)))
  }

  return { items, loading, unreadCount, fetchMine, markRead, markAllRead }
})
