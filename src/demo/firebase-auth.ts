/**
 * Mock de 'firebase/auth' para el modo DEMO.
 * Cuentas demo: admin@demo.com · residente@demo.com · portero@demo.com
 * (cualquier contraseña es válida en modo demo)
 */
import { docs, persist, getStoredUid, setStoredUid, randomId } from './mock-db'

export interface User {
  uid: string
  email: string | null
  delete: () => Promise<void>
}

type AuthListener = (user: User | null) => void

const listeners = new Set<AuthListener>()
let currentUser: User | null = null
let initialized = false

const ACCOUNT_PREFIX = '__auth' // __auth/{email} → { uid }

function makeUser(uid: string, email: string): User {
  return {
    uid,
    email,
    async delete() {
      // Eliminar cuenta y perfil (rollback de registro fallido)
      for (const [path, data] of docs) {
        if (path.startsWith(ACCOUNT_PREFIX + '/') && (data as { uid?: string }).uid === uid) {
          docs.delete(path)
        }
      }
      docs.delete(`users/${uid}`)
      persist()
      if (currentUser?.uid === uid) {
        currentUser = null
        setStoredUid(null)
        notify()
      }
    },
  }
}

function notify() {
  for (const cb of listeners) cb(currentUser)
}

function restore() {
  if (initialized) return
  initialized = true
  const uid = getStoredUid()
  if (!uid) return
  for (const [path, data] of docs) {
    if (path.startsWith(ACCOUNT_PREFIX + '/') && (data as { uid?: string }).uid === uid) {
      currentUser = makeUser(uid, path.slice(ACCOUNT_PREFIX.length + 1))
      return
    }
  }
}

function authError(code: string): Error & { code: string } {
  return Object.assign(new Error(code), { code })
}

export function getAuth(_app?: unknown) {
  return { __mock: 'auth' }
}

export function onAuthStateChanged(_auth: unknown, cb: AuthListener) {
  restore()
  listeners.add(cb)
  // Firebase llama al callback de forma asíncrona con el estado inicial
  queueMicrotask(() => cb(currentUser))
  return () => listeners.delete(cb)
}

export async function signInWithEmailAndPassword(_auth: unknown, email: string, _password: string) {
  restore()
  const key = `${ACCOUNT_PREFIX}/${email.toLowerCase().trim()}`
  const account = docs.get(key) as { uid: string } | undefined
  if (!account) throw authError('auth/invalid-credential')
  currentUser = makeUser(account.uid, email.toLowerCase().trim())
  setStoredUid(account.uid)
  notify()
  return { user: currentUser }
}

export async function createUserWithEmailAndPassword(_auth: unknown, email: string, password: string) {
  restore()
  const normalized = email.toLowerCase().trim()
  const key = `${ACCOUNT_PREFIX}/${normalized}`
  if (docs.has(key)) throw authError('auth/email-already-in-use')
  if (!/\S+@\S+\.\S+/.test(normalized)) throw authError('auth/invalid-email')
  if (password.length < 6) throw authError('auth/weak-password')
  const uid = `u-${randomId(12)}`
  docs.set(key, { uid })
  persist()
  currentUser = makeUser(uid, normalized)
  setStoredUid(uid)
  notify()
  return { user: currentUser }
}

export async function signOut(_auth: unknown) {
  currentUser = null
  setStoredUid(null)
  notify()
}

export async function sendPasswordResetEmail(_auth: unknown, _email: string) {
  // En modo demo no se envían correos
}
