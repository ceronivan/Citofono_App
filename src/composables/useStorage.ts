import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from '@/firebase'
import { useAuthStore } from '@/stores/auth.store'

export function useStorage() {
  const authStore = useAuthStore()

  async function uploadFile(file: File, path: string): Promise<string> {
    const fullPath = `complexes/${authStore.complexId}/${path}`
    const ref = storageRef(storage, fullPath)
    const snap = await uploadBytes(ref, file)
    return getDownloadURL(snap.ref)
  }

  async function deleteFile(url: string): Promise<void> {
    try {
      const ref = storageRef(storage, url)
      await deleteObject(ref)
    } catch {
      // File may not exist, ignore
    }
  }

  return { uploadFile, deleteFile }
}
