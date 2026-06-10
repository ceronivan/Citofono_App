/**
 * Capa de datos DEMO — base de datos en memoria con persistencia en localStorage.
 *
 * Sustituye a Firebase cuando VITE_DEMO_MODE=true (ver alias en vite.config.ts).
 * Para conectar Firebase real: poner VITE_DEMO_MODE=false en .env.local.
 */

const STORAGE_KEY = 'pr-demo-db-v1'
const AUTH_KEY = 'pr-demo-auth-uid'

// ─── Timestamp compatible con firebase/firestore ─────────────────────────────
export class Timestamp {
  seconds: number
  nanoseconds: number

  constructor(seconds: number, nanoseconds = 0) {
    this.seconds = seconds
    this.nanoseconds = nanoseconds
  }

  static now() {
    return Timestamp.fromMillis(Date.now())
  }
  static fromDate(date: Date) {
    return Timestamp.fromMillis(date.getTime())
  }
  static fromMillis(ms: number) {
    return new Timestamp(Math.floor(ms / 1000), (ms % 1000) * 1e6)
  }
  toDate() {
    return new Date(this.toMillis())
  }
  toMillis() {
    return this.seconds * 1000 + Math.round(this.nanoseconds / 1e6)
  }
  isEqual(other: Timestamp) {
    return this.toMillis() === other.toMillis()
  }
  toJSON() {
    return { __ts: this.toMillis() }
  }
}

// ─── Base de datos en memoria ─────────────────────────────────────────────────
/** path completo del documento → datos */
export const docs = new Map<string, Record<string, unknown>>()

let saveScheduled = false

export function persist() {
  if (saveScheduled) return
  saveScheduled = true
  queueMicrotask(() => {
    saveScheduled = false
    try {
      const obj: Record<string, unknown> = {}
      for (const [k, v] of docs) obj[k] = v
      localStorage.setItem(STORAGE_KEY, JSON.stringify(obj))
    } catch {
      /* almacenamiento lleno o no disponible — la demo sigue en memoria */
    }
  })
}

function revive(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value
  if (Array.isArray(value)) return value.map(revive)
  const obj = value as Record<string, unknown>
  if (typeof obj.__ts === 'number' && Object.keys(obj).length === 1) {
    return Timestamp.fromMillis(obj.__ts)
  }
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) out[k] = revive(v)
  return out
}

export function loadOrSeed(seedFn: () => void) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const obj = JSON.parse(raw) as Record<string, unknown>
      for (const [k, v] of Object.entries(obj)) {
        docs.set(k, revive(v) as Record<string, unknown>)
      }
      return
    }
  } catch {
    /* datos corruptos → re-seed */
  }
  seedFn()
  persist()
}

// ─── Sesión de auth demo ──────────────────────────────────────────────────────
export function getStoredUid(): string | null {
  return localStorage.getItem(AUTH_KEY)
}
export function setStoredUid(uid: string | null) {
  if (uid) localStorage.setItem(AUTH_KEY, uid)
  else localStorage.removeItem(AUTH_KEY)
}

// ─── Utilidades ───────────────────────────────────────────────────────────────
export function randomId(len = 20) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let out = ''
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

/** Reinicia la demo desde la consola del navegador: __demoReset() */
declare global {
  interface Window {
    __demoReset?: () => void
  }
}
if (typeof window !== 'undefined') {
  window.__demoReset = () => {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(AUTH_KEY)
    window.location.assign('/login')
  }
}
