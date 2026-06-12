import { create } from 'zustand'
import * as db from '../data/db'
import type { Invite, Membership, ResidentType, User, UserRole } from '../types'

const ACTIVE_KEY = 'pr.activeComplexId'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface AuthState {
  user: User | null
  activeComplexId: string | null
  initialized: boolean

  init: () => Promise<void>
  login: (email: string, password: string) => Promise<User>
  registerWithInvite: (params: {
    email: string
    password: string
    firstName: string
    lastName: string
    phone: string
    idNumber: string
    inviteCode: string
    tower?: string
    apartmentNumber?: string
  }) => Promise<User>
  registerAdmin: (params: {
    email: string
    password: string
    firstName: string
    lastName: string
    phone: string
    idNumber: string
  }) => Promise<void>
  addMembership: (m: Membership) => void
  setActiveComplex: (id: string) => void
  updateProfile: (patch: Partial<User>) => void
  logout: () => Promise<void>
}

function authError(code: string): Error & { code: string } {
  return Object.assign(new Error(code), { code })
}

export const useAuth = create<AuthState>()((set, get) => ({
  user: null,
  activeComplexId: null,
  initialized: false,

  async init() {
    if (get().initialized) return
    await db.ready()
    const uid = await db.getSessionUid()
    const stored = await AsyncStorage.getItem(ACTIVE_KEY)
    const user = uid ? (db.find<User & { id: string }>('users', uid) ?? null) : null
    set({ user, activeComplexId: stored, initialized: true })
  },

  async login(email, _password) {
    await db.ready()
    const account = db.find<{ id: string; uid: string }>('authAccounts', email.toLowerCase().trim())
    if (!account) throw authError('auth/invalid-credential')
    const user = db.find<User & { id: string }>('users', account.uid)
    if (!user) throw authError('auth/invalid-credential')
    await db.setSessionUid(user.id)
    const first = user.memberships[0]?.complexId ?? null
    set({ user, activeComplexId: first })
    if (first) await AsyncStorage.setItem(ACTIVE_KEY, first)
    return user
  },

  async registerWithInvite(params) {
    await db.ready()
    const email = params.email.toLowerCase().trim()
    if (db.find('authAccounts', email)) throw authError('auth/email-already-in-use')
    if (params.password.length < 6) throw authError('auth/weak-password')

    const invite = db.find<Invite & { id: string }>('invites', params.inviteCode.trim().toUpperCase())
    if (!invite) throw authError('INVITE_NOT_FOUND')
    if (!invite.active) throw authError('INVITE_INACTIVE')
    if (invite.maxUses > 0 && invite.usedCount >= invite.maxUses) throw authError('INVITE_EXHAUSTED')

    const unitId =
      invite.role === 'resident' && params.tower && params.apartmentNumber
        ? `${params.tower.replace(/\s+/g, '-')}_${params.apartmentNumber.trim()}`.toLowerCase()
        : undefined

    const residentType: ResidentType = invite.residentType ?? 'owner_resident'
    const membership: Membership = {
      complexId: invite.complexId,
      complexName: invite.complexName,
      role: invite.role,
      ...(invite.role === 'resident' ? { residentType } : {}),
      ...(unitId ? { unitId } : {}),
      ...(params.apartmentNumber ? { apartmentNumber: params.apartmentNumber.trim() } : {}),
      ...(params.tower ? { tower: params.tower } : {}),
    }

    const user = db.add<User & { id: string }>('users', {
      email,
      firstName: params.firstName.trim(),
      lastName: params.lastName.trim(),
      phone: params.phone.trim(),
      idNumber: params.idNumber.trim(),
      memberships: [membership],
      ...(params.apartmentNumber ? { apartmentNumber: params.apartmentNumber.trim() } : {}),
      isActive: true,
    })
    db.add('authAccounts', { id: email, uid: user.id })
    db.update('invites', invite.id, { usedCount: invite.usedCount + 1 })

    // Reclamar la unidad: como propietario o como habitante según el tipo
    if (unitId) {
      const unit = db.find<{ id: string; ownerIds: string[]; ownerNames?: string[]; tenantIds?: string[]; tenantNames?: string[] }>(
        db.col(invite.complexId, 'units'), unitId,
      )
      if (unit) {
        const fullName = `${params.firstName} ${params.lastName}`
        db.update(
          db.col(invite.complexId, 'units'),
          unitId,
          residentType === 'tenant'
            ? {
                tenantIds: [...(unit.tenantIds ?? []), user.id],
                tenantNames: [...(unit.tenantNames ?? []), fullName],
              }
            : {
                ownerIds: [...unit.ownerIds, user.id],
                ownerNames: [...(unit.ownerNames ?? []), fullName],
              },
        )
      }
    }

    await db.setSessionUid(user.id)
    await AsyncStorage.setItem(ACTIVE_KEY, invite.complexId)
    set({ user, activeComplexId: invite.complexId })
    return user
  },

  async registerAdmin(params) {
    await db.ready()
    const email = params.email.toLowerCase().trim()
    if (db.find('authAccounts', email)) throw authError('auth/email-already-in-use')
    if (params.password.length < 6) throw authError('auth/weak-password')
    const user = db.add<User & { id: string }>('users', {
      email,
      firstName: params.firstName.trim(),
      lastName: params.lastName.trim(),
      phone: params.phone.trim(),
      idNumber: params.idNumber.trim(),
      memberships: [],
      isActive: true,
    })
    db.add('authAccounts', { id: email, uid: user.id })
    await db.setSessionUid(user.id)
    set({ user, activeComplexId: null })
  },

  addMembership(m) {
    const user = get().user
    if (!user) return
    const updated = db.update<User & { id: string }>('users', user.id, {
      memberships: [...user.memberships, m],
    })
    set({ user: updated ?? user, activeComplexId: m.complexId })
    AsyncStorage.setItem(ACTIVE_KEY, m.complexId).catch(() => {})
  },

  setActiveComplex(id) {
    set({ activeComplexId: id })
    AsyncStorage.setItem(ACTIVE_KEY, id).catch(() => {})
  },

  updateProfile(patch) {
    const user = get().user
    if (!user) return
    const updated = db.update<User & { id: string }>('users', user.id, patch)
    set({ user: updated ?? user })
  },

  async logout() {
    await db.setSessionUid(null)
    set({ user: null, activeComplexId: null })
  },
}))

// ─── Selectores derivados ─────────────────────────────────────────────────────
export function selectMembership(s: Pick<AuthState, 'user' | 'activeComplexId'>): Membership | null {
  if (!s.user?.memberships.length) return null
  return s.user.memberships.find((m) => m.complexId === s.activeComplexId) ?? s.user.memberships[0]
}

export const selectRole = (s: AuthState): UserRole | null => selectMembership(s)?.role ?? null
export const selectComplexId = (s: AuthState): string | null => selectMembership(s)?.complexId ?? null

/** Tipo de residente del membership activo (datos v1 sin el campo = owner_resident). */
export const selectResidentType = (s: AuthState): ResidentType | null => {
  const m = selectMembership(s)
  if (m?.role !== 'resident') return null
  return m.residentType ?? 'owner_resident'
}

/** Hooks de conveniencia */
export const useMembership = () => useAuth(selectMembership)
export const useRole = () => useAuth(selectRole)
export const useComplexId = () => useAuth(selectComplexId)
export const useResidentType = () => useAuth(selectResidentType)

/** Capacidades derivadas del tipo de residente. */
export const RESIDENT_TYPE_META: Record<ResidentType, { label: string; icon: string }> = {
  owner_resident: { label: 'Propietario residente', icon: 'home-account' },
  owner: { label: 'Propietario', icon: 'key-chain-variant' },
  tenant: { label: 'Residente', icon: 'account-outline' },
}

/** Vive en la unidad → vida diaria (domicilios, correo, visitas, autorizaciones, reservas). */
export const isInhabitant = (t: ResidentType | null) => t === 'tenant' || t === 'owner_resident'
/** Es dueño → gestiona la unidad (vehículos). */
export const isOwner = (t: ResidentType | null) => t === 'owner' || t === 'owner_resident'

export const DASHBOARD: Record<UserRole, string> = {
  resident: '/resident',
  admin: '/admin',
  guard: '/guard',
}
