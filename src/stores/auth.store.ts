import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth'
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  runTransaction,
  arrayUnion,
} from 'firebase/firestore'
import { auth, db } from '@/firebase'
import type { User, Membership, Invite, UserRole } from '@/types'

const ACTIVE_COMPLEX_KEY = 'pr.activeComplexId'

export const useAuthStore = defineStore('auth', () => {
  const firebaseUser = ref<FirebaseUser | null>(null)
  const userData = ref<User | null>(null)
  const loading = ref(true)
  const activeComplexId = ref<string | null>(localStorage.getItem(ACTIVE_COMPLEX_KEY))

  // Dedupe multiple init() calls
  let _initPromise: Promise<void> | null = null

  const isAuthenticated = computed(() => !!firebaseUser.value)

  /**
   * Memberships del usuario. Back-compat: usuarios v1 con complexId/role planos
   * se tratan como una única membership sintética.
   */
  const memberships = computed<Membership[]>(() => {
    if (!userData.value) return []
    if (userData.value.memberships?.length) return userData.value.memberships
    if (userData.value.complexId) {
      return [
        {
          complexId: userData.value.complexId,
          complexName: 'Mi conjunto',
          role: userData.value.role,
          apartmentNumber: userData.value.apartmentNumber,
        },
      ]
    }
    return []
  })

  const activeMembership = computed<Membership | null>(() => {
    if (!memberships.value.length) return null
    return (
      memberships.value.find((m) => m.complexId === activeComplexId.value) ??
      memberships.value[0]
    )
  })

  const role = computed(() => activeMembership.value?.role ?? null)
  const complexId = computed(() => activeMembership.value?.complexId ?? null)
  const apartmentNumber = computed(() => activeMembership.value?.apartmentNumber ?? userData.value?.apartmentNumber)
  const unitId = computed(() => activeMembership.value?.unitId ?? null)
  const isResident = computed(() => role.value === 'resident')
  const isAdmin = computed(() => role.value === 'admin')
  const isGuard = computed(() => role.value === 'guard')
  const hasAdminMembership = computed(() => memberships.value.some((m) => m.role === 'admin'))
  const fullName = computed(() =>
    userData.value ? `${userData.value.firstName} ${userData.value.lastName}` : '',
  )

  function setActiveComplex(id: string) {
    activeComplexId.value = id
    localStorage.setItem(ACTIVE_COMPLEX_KEY, id)
  }

  async function _fetchUser(uid: string) {
    const snap = await getDoc(doc(db, 'users', uid))
    if (snap.exists()) {
      userData.value = { id: snap.id, ...snap.data() } as User
      // Si el activo guardado ya no es una membership válida, usar la primera
      if (
        memberships.value.length &&
        !memberships.value.some((m) => m.complexId === activeComplexId.value)
      ) {
        setActiveComplex(memberships.value[0].complexId)
      }
    }
  }

  function init(): Promise<void> {
    if (_initPromise) return _initPromise
    _initPromise = new Promise<void>((resolve) => {
      onAuthStateChanged(auth, async (user) => {
        firebaseUser.value = user
        if (user) {
          await _fetchUser(user.uid)
        } else {
          userData.value = null
        }
        loading.value = false
        resolve()
      })
    })
    return _initPromise
  }

  async function login(email: string, password: string): Promise<User> {
    const { user } = await signInWithEmailAndPassword(auth, email, password)
    await _fetchUser(user.uid)
    if (!userData.value) throw new Error('Usuario no encontrado en Firestore')
    return userData.value
  }

  /**
   * Registro con código de invitación. Crea la cuenta, valida el código y
   * agrega la membership. Si el código es inválido, elimina la cuenta creada.
   */
  async function registerWithInvite(params: {
    email: string
    password: string
    firstName: string
    lastName: string
    phone: string
    idNumber: string
    inviteCode: string
    unitId?: string
    apartmentNumber?: string
    tower?: string
  }): Promise<User> {
    const code = params.inviteCode.trim().toUpperCase()
    const { user } = await createUserWithEmailAndPassword(auth, params.email, params.password)
    try {
      const invite = await runTransaction(db, async (tx) => {
        const inviteRef = doc(db, 'invites', code)
        const snap = await tx.get(inviteRef)
        if (!snap.exists()) throw new Error('INVITE_NOT_FOUND')
        const inv = { id: snap.id, ...snap.data() } as Invite
        if (!inv.active) throw new Error('INVITE_INACTIVE')
        if (inv.maxUses > 0 && inv.usedCount >= inv.maxUses) throw new Error('INVITE_EXHAUSTED')
        if (inv.expiresAt && inv.expiresAt.toMillis() < Date.now()) throw new Error('INVITE_EXPIRED')
        tx.update(inviteRef, { usedCount: inv.usedCount + 1 })
        return inv
      })

      const membership: Membership = {
        complexId: invite.complexId,
        complexName: invite.complexName,
        role: invite.role,
        ...(params.unitId || invite.unitId ? { unitId: params.unitId ?? invite.unitId } : {}),
        ...(params.apartmentNumber ? { apartmentNumber: params.apartmentNumber } : {}),
        ...(params.tower ? { tower: params.tower } : {}),
      }

      const newUser: Omit<User, 'id' | 'createdAt' | 'updatedAt'> = {
        email: params.email,
        firstName: params.firstName,
        lastName: params.lastName,
        phone: params.phone,
        idNumber: params.idNumber,
        role: invite.role,
        complexId: invite.complexId,
        memberships: [membership],
        ...(params.apartmentNumber ? { apartmentNumber: params.apartmentNumber } : {}),
        isActive: true,
        fcmTokens: [],
      }

      await setDoc(doc(db, 'users', user.uid), {
        ...newUser,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      // Reclamar la unidad (agregarse como propietario)
      if (membership.unitId) {
        const unitRef = doc(db, 'complexes', invite.complexId, 'units', membership.unitId)
        await updateDoc(unitRef, {
          ownerIds: arrayUnion(user.uid),
          ownerNames: arrayUnion(`${params.firstName} ${params.lastName}`),
          updatedAt: serverTimestamp(),
        }).catch(() => {/* la unidad puede no existir en datos legacy */})
      }

      setActiveComplex(invite.complexId)
      await _fetchUser(user.uid)
      return userData.value!
    } catch (e) {
      // Código inválido → revertir la cuenta recién creada
      await user.delete().catch(() => signOut(auth))
      throw e
    }
  }

  /**
   * Registro de un administrador nuevo (sin código). El edificio se crea
   * después con el wizard, que agrega la membership de admin.
   */
  async function registerAdmin(params: {
    email: string
    password: string
    firstName: string
    lastName: string
    phone: string
    idNumber: string
  }): Promise<void> {
    const { user } = await createUserWithEmailAndPassword(auth, params.email, params.password)
    await setDoc(doc(db, 'users', user.uid), {
      email: params.email,
      firstName: params.firstName,
      lastName: params.lastName,
      phone: params.phone,
      idNumber: params.idNumber,
      role: 'admin',
      complexId: '',
      memberships: [],
      isActive: true,
      fcmTokens: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    await _fetchUser(user.uid)
  }

  /** Agrega una membership al usuario actual (usado por el wizard de creación de edificio). */
  async function addMembership(membership: Membership) {
    if (!firebaseUser.value) throw new Error('No autenticado')
    await updateDoc(doc(db, 'users', firebaseUser.value.uid), {
      memberships: arrayUnion(membership),
      complexId: membership.complexId,
      updatedAt: serverTimestamp(),
    })
    await _fetchUser(firebaseUser.value.uid)
    setActiveComplex(membership.complexId)
  }

  async function logout() {
    await signOut(auth)
    userData.value = null
    firebaseUser.value = null
    _initPromise = null
    // Recarga completa: garantiza que todos los stores queden limpios
    // y el usuario vea el login (puede entrar con otro rol)
    window.location.assign('/login')
  }

  async function resetPassword(email: string) {
    await sendPasswordResetEmail(auth, email)
  }

  async function updateProfile(data: Partial<User>) {
    if (!firebaseUser.value) return
    await updateDoc(doc(db, 'users', firebaseUser.value.uid), {
      ...data,
      updatedAt: serverTimestamp(),
    })
    userData.value = { ...userData.value!, ...data }
  }

  return {
    firebaseUser,
    userData,
    loading,
    isAuthenticated,
    memberships,
    activeComplexId,
    activeMembership,
    role,
    complexId,
    apartmentNumber,
    unitId,
    isResident,
    isAdmin,
    isGuard,
    hasAdminMembership,
    fullName,
    init,
    login,
    registerWithInvite,
    registerAdmin,
    addMembership,
    setActiveComplex,
    logout,
    resetPassword,
    updateProfile,
  }
})
