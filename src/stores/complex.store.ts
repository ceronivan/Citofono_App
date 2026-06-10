import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  writeBatch,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from '@/firebase'
import { useAuthStore } from './auth.store'
import type { Complex, Unit, Amenity, Invite, UserRole, FeeStatus } from '@/types'

export interface TowerConfig {
  name: string
  floors: number
  unitsPerFloor: number
}

const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789' // sin caracteres ambiguos

function randomCode(len: number) {
  let out = ''
  for (let i = 0; i < len; i++) out += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
  return out
}

export const useComplexStore = defineStore('complex', () => {
  const authStore = useAuthStore()

  const current = ref<Complex | null>(null)
  const units = ref<Unit[]>([])
  const invites = ref<Invite[]>([])
  const loading = ref(false)

  const amenities = computed<Amenity[]>(() => current.value?.amenities ?? [])
  const activeAmenities = computed(() => amenities.value.filter((a) => a.active))
  const towers = computed(() => current.value?.towers ?? [])

  /** Unidad del residente actual (para validar estado de cartera). */
  const myUnit = computed<Unit | null>(() => {
    const m = authStore.activeMembership
    if (!m) return null
    if (m.unitId) return units.value.find((u) => u.id === m.unitId) ?? null
    if (m.apartmentNumber)
      return units.value.find((u) => u.number === m.apartmentNumber) ?? null
    return null
  })

  async function fetchCurrent(force = false) {
    if (!authStore.complexId) {
      current.value = null
      return
    }
    if (current.value?.id === authStore.complexId && !force) return
    loading.value = true
    try {
      const snap = await getDoc(doc(db, 'complexes', authStore.complexId))
      current.value = snap.exists() ? ({ id: snap.id, ...snap.data() } as Complex) : null
    } finally {
      loading.value = false
    }
  }

  async function fetchUnits(force = false) {
    if (!authStore.complexId) return
    if (units.value.length && current.value?.id === authStore.complexId && !force) return
    const snap = await getDocs(
      query(collection(db, 'complexes', authStore.complexId, 'units'), orderBy('label')),
    )
    units.value = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Unit)
  }

  async function fetchInvites() {
    if (!authStore.complexId) return
    const snap = await getDocs(
      query(collection(db, 'invites'), where('complexId', '==', authStore.complexId)),
    )
    invites.value = (snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Invite)).sort(
      (a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0),
    )
  }

  /** Crea edificio + unidades + código de invitación inicial + membership admin. */
  async function createBuilding(params: {
    name: string
    address: string
    city: string
    phone?: string
    email?: string
    towersConfig: TowerConfig[]
    amenities: Amenity[]
  }): Promise<{ complexId: string; inviteCode: string }> {
    const uid = authStore.userData!.id

    const complexRef = await addDoc(collection(db, 'complexes'), {
      name: params.name,
      address: params.address,
      city: params.city,
      phone: params.phone ?? '',
      email: params.email ?? '',
      logoUrl: '',
      towers: params.towersConfig.map((t) => t.name),
      amenities: params.amenities,
      createdBy: uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    // Generar unidades: piso × unidades por piso → "501" = piso 5, apto 01
    const unitDocs: { id: string; data: Record<string, unknown> }[] = []
    for (const tower of params.towersConfig) {
      for (let floor = 1; floor <= tower.floors; floor++) {
        for (let u = 1; u <= tower.unitsPerFloor; u++) {
          const number = `${floor}${String(u).padStart(2, '0')}`
          const id = `${tower.name.replace(/\s+/g, '-')}_${number}`.toLowerCase()
          unitDocs.push({
            id,
            data: {
              tower: tower.name,
              number,
              label:
                params.towersConfig.length > 1 ? `${tower.name} · ${number}` : number,
              ownerIds: [],
              ownerNames: [],
              feeStatus: 'current' as FeeStatus,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            },
          })
        }
      }
    }

    // Firestore limita 500 escrituras por batch
    for (let i = 0; i < unitDocs.length; i += 450) {
      const batch = writeBatch(db)
      for (const u of unitDocs.slice(i, i + 450)) {
        batch.set(doc(db, 'complexes', complexRef.id, 'units', u.id), u.data)
      }
      await batch.commit()
    }

    const inviteCode = await createInvite({
      complexId: complexRef.id,
      complexName: params.name,
      towers: params.towersConfig.map((t) => t.name),
      role: 'resident',
      maxUses: 0, // ilimitado
    })

    await authStore.addMembership({
      complexId: complexRef.id,
      complexName: params.name,
      role: 'admin',
    })

    return { complexId: complexRef.id, inviteCode }
  }

  async function createInvite(params: {
    complexId?: string
    complexName?: string
    towers?: string[]
    role: UserRole
    unitId?: string
    maxUses?: number
    expiresAt?: Date
  }): Promise<string> {
    const cId = params.complexId ?? authStore.complexId!
    const cName = params.complexName ?? current.value?.name ?? ''
    const cTowers = params.towers ?? current.value?.towers ?? []
    const prefix = cName
      .split(/\s+/)
      .filter((w) => w.length > 2)[0]?.toUpperCase().replace(/[^A-Z0-9]/g, '')
      .slice(0, 5) || 'PORTAL'
    const code = `${prefix}-${randomCode(4)}`
    await setDoc(doc(db, 'invites', code), {
      complexId: cId,
      complexName: cName,
      towers: cTowers,
      role: params.role,
      ...(params.unitId ? { unitId: params.unitId } : {}),
      maxUses: params.maxUses ?? 0,
      usedCount: 0,
      ...(params.expiresAt ? { expiresAt: Timestamp.fromDate(params.expiresAt) } : {}),
      active: true,
      createdBy: authStore.userData!.id,
      createdAt: serverTimestamp(),
    })
    return code
  }

  async function toggleInvite(code: string, active: boolean) {
    await updateDoc(doc(db, 'invites', code), { active })
    const inv = invites.value.find((i) => i.id === code)
    if (inv) inv.active = active
  }

  async function removeInvite(code: string) {
    await deleteDoc(doc(db, 'invites', code))
    invites.value = invites.value.filter((i) => i.id !== code)
  }

  async function updateComplex(data: Partial<Omit<Complex, 'id'>>) {
    if (!current.value) return
    await updateDoc(doc(db, 'complexes', current.value.id), {
      ...data,
      updatedAt: serverTimestamp(),
    })
    current.value = { ...current.value, ...data } as Complex
  }

  async function saveAmenities(list: Amenity[]) {
    await updateComplex({ amenities: list })
  }

  async function setUnitFeeStatus(
    unitId: string,
    feeStatus: FeeStatus,
    feePeriod: string,
    feeNotes?: string,
  ) {
    await updateDoc(doc(db, 'complexes', authStore.complexId!, 'units', unitId), {
      feeStatus,
      feePeriod,
      feeNotes: feeNotes ?? '',
      feeUpdatedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    const u = units.value.find((x) => x.id === unitId)
    if (u) Object.assign(u, { feeStatus, feePeriod, feeNotes })
  }

  /** Llamar al cambiar de edificio para refrescar todo. */
  async function switchTo(complexId: string) {
    authStore.setActiveComplex(complexId)
    current.value = null
    units.value = []
    invites.value = []
    await Promise.all([fetchCurrent(true), fetchUnits(true)])
  }

  return {
    current,
    units,
    invites,
    loading,
    amenities,
    activeAmenities,
    towers,
    myUnit,
    fetchCurrent,
    fetchUnits,
    fetchInvites,
    createBuilding,
    createInvite,
    toggleInvite,
    removeInvite,
    updateComplex,
    saveAmenities,
    setUnitFeeStatus,
    switchTo,
  }
})
