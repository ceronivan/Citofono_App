/**
 * Mock de 'firebase/storage' para el modo DEMO.
 * Las imágenes subidas se convierten en object URLs locales (viven mientras
 * dure la sesión del navegador).
 */
export function getStorage(_app?: unknown) {
  return { __mock: 'storage' }
}

interface MockStorageRef {
  __kind: 'storageRef'
  path: string
  url?: string
}

export function ref(_storage: unknown, path: string): MockStorageRef {
  return { __kind: 'storageRef', path }
}

export async function uploadBytes(reference: MockStorageRef, data: Blob) {
  reference.url = URL.createObjectURL(data)
  return { ref: reference }
}

export async function getDownloadURL(reference: MockStorageRef): Promise<string> {
  return reference.url ?? `https://picsum.photos/seed/${encodeURIComponent(reference.path)}/600/400`
}

export async function deleteObject(_reference: MockStorageRef) {
  // no-op en demo
}
