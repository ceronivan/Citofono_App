/**
 * Capa de datos DEMO — colecciones en memoria persistidas en AsyncStorage.
 *
 * Arquitectura intercambiable: los stores (zustand) solo usan este módulo.
 * Para conectar Firebase real más adelante, se implementa el mismo API
 * (list/add/update/remove) sobre Firestore sin tocar pantallas ni stores.
 */
import AsyncStorage from '@react-native-async-storage/async-storage'
import { seedDemoData } from './seed'
import { bumpDataVersion } from './version'

// v3: facturación/contabilidad (cuotas, gastos) + multas archivables
const STORAGE_KEY = 'pr-rn-demo-db-v3'
const SESSION_KEY = 'pr-rn-session-uid'

type Row = { id: string } & Record<string, unknown>

let collections: Record<string, Row[]> = {}
let loaded = false
let loadPromise: Promise<void> | null = null

function randomId(len = 16) {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  let out = ''
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

let saveScheduled = false
function persist() {
  bumpDataVersion()
  if (saveScheduled) return
  saveScheduled = true
  queueMicrotask(() => {
    saveScheduled = false
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(collections)).catch(() => {})
  })
}

/** Carga la base desde AsyncStorage (o siembra la demo la primera vez). */
export function ready(): Promise<void> {
  if (loaded) return Promise.resolve()
  if (loadPromise) return loadPromise
  loadPromise = (async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY)
      if (raw) {
        collections = JSON.parse(raw)
        loaded = true
        return
      }
    } catch {
      /* datos corruptos → re-seed */
    }
    collections = seedDemoData()
    loaded = true
    persist()
  })()
  return loadPromise
}

export function list<T extends { id: string }>(key: string): T[] {
  return (collections[key] ?? []) as unknown as T[]
}

export function find<T extends { id: string }>(key: string, id: string): T | undefined {
  return list<T>(key).find((r) => r.id === id)
}

// Los payloads son laxos a propósito: esta capa demo emula un documento NoSQL.
// La capa Firebase real puede tipar más estricto con converters.
export function add<T extends { id: string } = { id: string }>(
  key: string,
  item: Record<string, unknown> & { id?: string },
): T {
  const row = { createdAt: Date.now(), ...item, id: item.id ?? randomId() } as unknown as T
  collections[key] = [...(collections[key] ?? []), row as unknown as Row]
  persist()
  return row
}

export function update<T extends { id: string } = { id: string }>(
  key: string,
  id: string,
  patch: Record<string, unknown>,
): T | undefined {
  const rows = collections[key] ?? []
  const idx = rows.findIndex((r) => r.id === id)
  if (idx < 0) return undefined
  rows[idx] = { ...rows[idx], ...patch }
  collections[key] = [...rows]
  persist()
  return rows[idx] as unknown as T
}

export function remove(key: string, id: string) {
  collections[key] = (collections[key] ?? []).filter((r) => r.id !== id)
  persist()
}

/** Reemplaza una colección completa. */
export function setAll<T extends { id: string }>(key: string, rows: T[]) {
  collections[key] = rows as unknown as Row[]
  persist()
}

// ─── Sesión ───────────────────────────────────────────────────────────────────
export async function getSessionUid(): Promise<string | null> {
  return AsyncStorage.getItem(SESSION_KEY)
}
export async function setSessionUid(uid: string | null) {
  if (uid) await AsyncStorage.setItem(SESSION_KEY, uid)
  else await AsyncStorage.removeItem(SESSION_KEY)
}

/** Borra todo y vuelve a sembrar (botón de reset de la demo). */
export async function resetDemo() {
  await AsyncStorage.multiRemove([STORAGE_KEY, SESSION_KEY])
  collections = seedDemoData()
  loaded = true
  persist()
}

/** Helper para rutas de colección por edificio. */
export const col = (complexId: string, name: string) => `${complexId}/${name}`
