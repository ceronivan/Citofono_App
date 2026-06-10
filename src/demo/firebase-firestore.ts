/**
 * Mock de 'firebase/firestore' para el modo DEMO.
 * Implementa exactamente el subconjunto de la API que usa la app.
 */
import { docs, persist, randomId, Timestamp } from './mock-db'
import { seedDemoData } from './seed'
import { loadOrSeed } from './mock-db'

loadOrSeed(seedDemoData)

export { Timestamp }

// ─── Tipos de referencia ──────────────────────────────────────────────────────
export interface DocumentReference {
  __kind: 'doc'
  path: string
  id: string
}
export interface CollectionReference {
  __kind: 'col'
  path: string
}
interface WhereConstraint {
  __c: 'where'
  field: string
  op: string
  value: unknown
}
interface OrderByConstraint {
  __c: 'orderBy'
  field: string
  dir: 'asc' | 'desc'
}
export type QueryConstraint = WhereConstraint | OrderByConstraint
interface Query {
  __kind: 'query'
  path: string
  constraints: QueryConstraint[]
}

// Sentinelas
const ARRAY_UNION = Symbol('arrayUnion')
interface ArrayUnionSentinel {
  __sentinel: typeof ARRAY_UNION
  values: unknown[]
}

export function getFirestore(_app?: unknown) {
  return { __mock: 'firestore' }
}

export function collection(_db: unknown, ...segments: string[]): CollectionReference {
  return { __kind: 'col', path: segments.join('/') }
}

export function doc(_db: unknown, ...segments: string[]): DocumentReference {
  const path = segments.join('/')
  return { __kind: 'doc', path, id: segments[segments.length - 1] }
}

export function query(
  ref: CollectionReference | Query,
  ...constraints: QueryConstraint[]
): Query {
  const base = '__kind' in ref && ref.__kind === 'query' ? (ref as Query) : null
  return {
    __kind: 'query',
    path: base ? base.path : (ref as CollectionReference).path,
    constraints: [...(base?.constraints ?? []), ...constraints],
  }
}

export function where(field: string, op: string, value: unknown): WhereConstraint {
  return { __c: 'where', field, op, value }
}

export function orderBy(field: string, dir: 'asc' | 'desc' = 'asc'): OrderByConstraint {
  return { __c: 'orderBy', field, dir }
}

export function serverTimestamp() {
  return Timestamp.now()
}

export function arrayUnion(...values: unknown[]): ArrayUnionSentinel {
  return { __sentinel: ARRAY_UNION, values }
}

// ─── Resolución de sentinelas ─────────────────────────────────────────────────
function resolveValue(existing: unknown, incoming: unknown): unknown {
  if (incoming && typeof incoming === 'object' && (incoming as ArrayUnionSentinel).__sentinel === ARRAY_UNION) {
    const sentinel = incoming as ArrayUnionSentinel
    const base = Array.isArray(existing) ? [...existing] : []
    for (const v of sentinel.values) {
      if (!base.some((x) => JSON.stringify(x) === JSON.stringify(v))) base.push(v)
    }
    return base
  }
  return incoming
}

function applyData(
  path: string,
  data: Record<string, unknown>,
  mode: 'set' | 'merge' | 'update',
) {
  const existing = docs.get(path)
  if (mode === 'update' && !existing) {
    throw Object.assign(new Error(`No document to update: ${path}`), { code: 'not-found' })
  }
  const base = mode === 'set' ? {} : { ...(existing ?? {}) }
  for (const [k, v] of Object.entries(data)) {
    base[k] = resolveValue(existing?.[k], v)
  }
  docs.set(path, base)
  persist()
}

// ─── Snapshots ────────────────────────────────────────────────────────────────
function docSnap(path: string) {
  const data = docs.get(path)
  const id = path.split('/').pop()!
  return {
    id,
    ref: { __kind: 'doc', path, id } as DocumentReference,
    exists: () => data !== undefined,
    data: () => (data ? { ...data } : undefined),
  }
}

function getField(obj: Record<string, unknown>, field: string): unknown {
  return field.split('.').reduce<unknown>((acc, k) => (acc as Record<string, unknown>)?.[k], obj)
}

function compare(a: unknown, b: unknown): number {
  const av = a instanceof Timestamp ? a.toMillis() : a
  const bv = b instanceof Timestamp ? b.toMillis() : b
  if (av == null && bv == null) return 0
  if (av == null) return -1
  if (bv == null) return 1
  if (typeof av === 'string' && typeof bv === 'string') return av.localeCompare(bv)
  return (av as number) < (bv as number) ? -1 : (av as number) > (bv as number) ? 1 : 0
}

function matches(data: Record<string, unknown>, c: WhereConstraint): boolean {
  const v = getField(data, c.field)
  switch (c.op) {
    case '==': {
      const lhs = v instanceof Timestamp ? v.toMillis() : v
      const rhs = c.value instanceof Timestamp ? c.value.toMillis() : c.value
      return lhs === rhs
    }
    case '>=': return compare(v, c.value) >= 0
    case '<=': return compare(v, c.value) <= 0
    case '>': return compare(v, c.value) > 0
    case '<': return compare(v, c.value) < 0
    case '!=': return v !== c.value
    case 'in': return Array.isArray(c.value) && c.value.includes(v)
    case 'array-contains': return Array.isArray(v) && v.includes(c.value)
    default: return true
  }
}

function collectDocs(colPath: string) {
  const prefix = colPath + '/'
  const depth = colPath.split('/').length + 1
  const out: { path: string; data: Record<string, unknown> }[] = []
  for (const [p, d] of docs) {
    if (p.startsWith(prefix) && p.split('/').length === depth) out.push({ path: p, data: d })
  }
  return out
}

// ─── Lecturas ─────────────────────────────────────────────────────────────────
export async function getDoc(ref: DocumentReference) {
  return docSnap(ref.path)
}

export async function getDocs(refOrQuery: CollectionReference | Query) {
  const isQuery = (refOrQuery as Query).__kind === 'query'
  const path = refOrQuery.path
  const constraints = isQuery ? (refOrQuery as Query).constraints : []

  let rows = collectDocs(path)
  for (const c of constraints) {
    if (c.__c === 'where') rows = rows.filter((r) => matches(r.data, c))
  }
  const orders = constraints.filter((c): c is OrderByConstraint => c.__c === 'orderBy')
  for (const o of [...orders].reverse()) {
    rows.sort((x, y) => {
      const r = compare(getField(x.data, o.field), getField(y.data, o.field))
      return o.dir === 'desc' ? -r : r
    })
  }
  const snapDocs = rows.map((r) => docSnap(r.path))
  return { docs: snapDocs, size: snapDocs.length, empty: snapDocs.length === 0 }
}

// ─── Escrituras ───────────────────────────────────────────────────────────────
export async function addDoc(col: CollectionReference, data: Record<string, unknown>) {
  const id = randomId()
  const path = `${col.path}/${id}`
  applyData(path, data, 'set')
  return { __kind: 'doc', path, id } as DocumentReference
}

export async function setDoc(
  ref: DocumentReference,
  data: Record<string, unknown>,
  options?: { merge?: boolean },
) {
  applyData(ref.path, data, options?.merge ? 'merge' : 'set')
}

export async function updateDoc(ref: DocumentReference, data: Record<string, unknown>) {
  applyData(ref.path, data, 'update')
}

export async function deleteDoc(ref: DocumentReference) {
  docs.delete(ref.path)
  persist()
}

// ─── Batch y transacciones ────────────────────────────────────────────────────
export function writeBatch(_db: unknown) {
  const ops: (() => void)[] = []
  return {
    set(ref: DocumentReference, data: Record<string, unknown>, options?: { merge?: boolean }) {
      ops.push(() => applyData(ref.path, data, options?.merge ? 'merge' : 'set'))
    },
    update(ref: DocumentReference, data: Record<string, unknown>) {
      ops.push(() => applyData(ref.path, data, 'update'))
    },
    delete(ref: DocumentReference) {
      ops.push(() => { docs.delete(ref.path); persist() })
    },
    async commit() {
      for (const op of ops) op()
    },
  }
}

export async function runTransaction<T>(
  _db: unknown,
  fn: (tx: {
    get: (ref: DocumentReference) => Promise<ReturnType<typeof docSnap>>
    set: (ref: DocumentReference, data: Record<string, unknown>) => void
    update: (ref: DocumentReference, data: Record<string, unknown>) => void
  }) => Promise<T>,
): Promise<T> {
  const tx = {
    get: async (ref: DocumentReference) => docSnap(ref.path),
    set: (ref: DocumentReference, data: Record<string, unknown>) => applyData(ref.path, data, 'set'),
    update: (ref: DocumentReference, data: Record<string, unknown>) => applyData(ref.path, data, 'update'),
  }
  return fn(tx)
}
