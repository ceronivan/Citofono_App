import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  collection, query, orderBy, getDocs, getDoc, doc,
  addDoc, updateDoc, deleteDoc, serverTimestamp, Timestamp,
} from 'firebase/firestore'
import { db } from '@/firebase'
import { useAuthStore } from './auth.store'
import { useStorage } from '@/composables/useStorage'
import { useHttp } from '@/composables/useHttp'
import type { News } from '@/types'

export const useNewsStore = defineStore('news', () => {
  const authStore = useAuthStore()
  const { uploadFile } = useStorage()
  const { http } = useHttp()
  const items = ref<News[]>([])
  const current = ref<News | null>(null)
  const loading = ref(false)

  function col() {
    return collection(db, 'complexes', authStore.complexId!, 'news')
  }

  async function fetchAll() {
    loading.value = true
    try {
      const snap = await getDocs(query(col(), orderBy('publishedAt', 'desc')))
      items.value = snap.docs.map(d => ({ id: d.id, ...d.data() }) as News)
    } finally {
      loading.value = false
    }
  }

  async function fetchOne(id: string) {
    const snap = await getDoc(doc(db, 'complexes', authStore.complexId!, 'news', id))
    current.value = snap.exists() ? ({ id: snap.id, ...snap.data() } as News) : null
  }

  async function create(title: string, body: string, attachment?: File) {
    let attachmentUrl = ''
    let attachmentType: 'image' | 'pdf' | undefined
    if (attachment) {
      attachmentUrl = await uploadFile(attachment, `news/${Date.now()}`)
      attachmentType = attachment.type === 'application/pdf' ? 'pdf' : 'image'
    }
    const docRef = await addDoc(col(), {
      authorId: authStore.userData!.id,
      title, body,
      attachmentUrl,
      attachmentType: attachmentType ?? null,
      hasAttachment: !!attachment,
      publishedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    await fetchAll()

    // Broadcast push + in-app notification to all residents
    http.post('/notifications/broadcast', {
      title: `📰 Nueva noticia: ${title}`,
      body: body.slice(0, 120),
      type: 'news',
      relatedDocId: docRef.id,
      relatedCollection: 'news',
    }).catch(() => { /* non-blocking */ })

    return docRef.id
  }

  async function update(id: string, title: string, body: string, attachment?: File) {
    const data: Record<string, unknown> = { title, body, updatedAt: serverTimestamp() }
    if (attachment) {
      data.attachmentUrl = await uploadFile(attachment, `news/${id}`)
      data.attachmentType = attachment.type === 'application/pdf' ? 'pdf' : 'image'
      data.hasAttachment = true
    }
    await updateDoc(doc(db, 'complexes', authStore.complexId!, 'news', id), data)
    await fetchAll()
  }

  async function remove(id: string) {
    await deleteDoc(doc(db, 'complexes', authStore.complexId!, 'news', id))
    items.value = items.value.filter(n => n.id !== id)
  }

  return { items, current, loading, fetchAll, fetchOne, create, update, remove }
})
