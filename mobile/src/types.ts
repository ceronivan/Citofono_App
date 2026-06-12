/**
 * Modelos de datos — port de frontend/src/types/index.ts.
 * En modo demo los timestamps son milisegundos epoch (number) para serializar
 * fácil en AsyncStorage; la capa Firebase real puede convertir Timestamp↔millis.
 */
export type Millis = number

export type UserRole = 'resident' | 'admin' | 'guard'

/**
 * Relación de un residente con su unidad:
 *  - owner_resident: propietario que habita el apartamento (acceso completo)
 *  - owner:          propietario que NO habita (gestiona la unidad: vehículos,
 *                    multas, daños, PQRs, circulares, noticias, mantenimientos)
 *  - tenant:         habitante no propietario (vida diaria: domicilios, correo,
 *                    visitas, autorizaciones, reservas + lo informativo)
 * Los datos v1 sin residentType se tratan como owner_resident.
 */
export type ResidentType = 'owner_resident' | 'owner' | 'tenant'

export interface Amenity {
  id: string
  name: string
  icon: string
  requiresApproval: boolean
  blockIfDelinquent: boolean
  active: boolean
}

export interface Complex {
  id: string
  name: string
  address: string
  city: string
  phone?: string
  email?: string
  towers: string[]
  amenities: Amenity[]
  /** Cuota de administración mensual base (COP); las unidades pueden tener override. */
  feeBase?: number
  /** Día del mes en que vence la cuota (default 10). */
  feeDueDay?: number
  createdBy: string
  createdAt: Millis
}

export type FeeStatus = 'current' | 'delinquent'

export interface Unit {
  id: string
  tower: string
  number: string
  label: string
  ownerIds: string[]
  ownerNames?: string[]
  tenantIds?: string[]
  tenantNames?: string[]
  feeStatus: FeeStatus
  feePeriod?: string
  feeNotes?: string
  /** Cuota mensual específica de esta unidad; si falta aplica Complex.feeBase. */
  feeOverride?: number
}

export interface Membership {
  complexId: string
  complexName: string
  role: UserRole
  residentType?: ResidentType // solo cuando role === 'resident'; ausente = owner_resident
  unitId?: string
  apartmentNumber?: string
  tower?: string
}

export interface EmergencyContact {
  name: string
  phone: string
  relationship: string
}

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string
  idNumber: string
  memberships: Membership[]
  apartmentNumber?: string
  photoUrl?: string
  bloodType?: string
  emergencyContact?: EmergencyContact
  isActive: boolean
}

export interface Invite {
  id: string // el código, ej. "PRADO-DEMO"
  complexId: string
  complexName: string
  towers: string[]
  role: UserRole
  residentType?: ResidentType // solo cuando role === 'resident'
  maxUses: number
  usedCount: number
  active: boolean
  createdBy: string
  createdAt: Millis
}

export type VehicleType = 'car' | 'motorcycle' | 'bicycle' | 'truck' | 'other'

export interface Vehicle {
  id: string
  ownerId: string // quién lo registró (el propietario de la unidad)
  unitId?: string // los vehículos pertenecen a la unidad, no al usuario
  tower?: string
  apartmentNumber: string
  type: VehicleType
  brand: string
  color: string
  plate: string
  photoUrl?: string
  createdAt: Millis
}

export type AuthorizationType = 'person' | 'vehicle'

export interface Authorization {
  id: string
  type?: AuthorizationType // ausente en datos v1 = 'person'
  grantedBy: string
  apartmentNumber: string
  tower?: string
  person?: { firstName: string; lastName: string; idNumber: string; photoUrl?: string }
  vehicle?: { plate: string; description?: string }
  validFrom: Millis
  validUntil: Millis
  createdAt: Millis
}

export type ReservationStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

export interface Reservation {
  id: string
  residentId: string
  apartmentNumber: string
  title: string
  responsibleName: string
  amenityId: string
  amenityName: string
  startDateTime: Millis
  endDateTime: Millis
  status: ReservationStatus
  adminNotes?: string
  createdAt: Millis
}

export type VisitType = 'pedestrian' | 'vehicle'

export interface Visit {
  id: string
  type: VisitType
  guardId: string
  apartmentNumber: string
  residentId?: string
  visitorName?: string
  visitorIdNumber?: string
  driverName?: string
  vehiclePlate?: string
  entryTime: Millis
  exitTime?: Millis | null
  duration?: number
  notes?: string
  createdAt: Millis
}

export interface Post {
  // Noticias y circulares comparten forma
  id: string
  authorId: string
  title: string
  body: string
  attachmentUrl?: string
  hasAttachment: boolean
  publishedAt: Millis
  createdAt: Millis
}

export type MailType = 'package' | 'letter' | 'document' | 'other'
export type MailStatus = 'pending' | 'delivered' | 'confirmed'

export interface Mail {
  id: string
  registeredBy: string
  apartmentNumber: string
  residentId?: string
  description: string
  type: MailType
  sender?: string
  photoUrl?: string
  status: MailStatus
  deliveredAt?: Millis
  createdAt: Millis
}

export type TicketStatus = 'pending' | 'in_review' | 'resolved'
export type PQRCategory = 'noise' | 'damage' | 'services' | 'security' | 'admin' | 'other'

export interface PQR {
  id: string
  authorId: string
  apartmentNumber: string
  category: PQRCategory
  title: string
  description: string
  status: TicketStatus
  adminResponse?: string
  createdAt: Millis
}

export interface DamageReport {
  id: string
  authorId: string
  apartmentNumber: string
  tower?: string // los daños son visibles para toda la unidad (dueño + habitante)
  title: string
  description: string
  status: TicketStatus
  adminResponse?: string
  createdAt: Millis
}

// ─── Multas y llamados de atención ───────────────────────────────────────────
export type SanctionType = 'fine' | 'warning'
export type SanctionStatus = 'pending' | 'paid' | 'cancelled'

/** Multa o llamado de atención emitido por la administración a una unidad.
 *  Visible tanto para el propietario como para quien habita el apartamento. */
export interface Sanction {
  id: string
  unitId?: string
  tower?: string
  apartmentNumber: string
  type: SanctionType
  title: string
  description?: string
  amount?: number // solo multas (COP)
  status?: SanctionStatus // solo multas
  /** Archivada: sale de las vistas activas pero se conserva para contabilidad. */
  archived?: boolean
  /** Cuota (Invoice) en la que se facturó esta multa — evita doble cobro. */
  invoiceId?: string
  issuedBy: string
  createdAt: Millis
}

// ─── Facturación / contabilidad ──────────────────────────────────────────────
export type InvoiceItemKind = 'fee' | 'sanction' | 'extra'

export interface InvoiceItem {
  kind: InvoiceItemKind
  label: string
  amount: number
  sanctionId?: string
}

export type InvoiceStatus = 'pending' | 'paid'
export type PaymentMethod = 'transfer' | 'cash' | 'other'

/** Cuota de administración de una unidad para un periodo (YYYY-MM).
 *  Cruza la cuota base/override con multas pendientes y cobros extra. */
export interface Invoice {
  id: string
  unitId: string
  tower?: string
  apartmentNumber: string
  period: string // YYYY-MM
  items: InvoiceItem[]
  total: number
  status: InvoiceStatus
  dueDate: Millis
  paidAt?: Millis
  paymentMethod?: PaymentMethod
  createdAt: Millis
}

export type ExpenseCategory =
  | 'security' | 'cleaning' | 'maintenance' | 'utilities'
  | 'gardening' | 'insurance' | 'admin' | 'other'

/** Pago a proveedor o servicio contratado por la administración. */
export interface Expense {
  id: string
  category: ExpenseCategory
  provider: string
  description?: string
  amount: number
  date: Millis
  createdAt: Millis
}

export type NotificationType =
  | 'visit' | 'mail' | 'reservation' | 'news' | 'pqr'
  | 'damage' | 'circular' | 'delivery' | 'maintenance' | 'billing' | 'sanction'

export interface AppNotification {
  id: string
  recipientId: string
  title: string
  body: string
  type: NotificationType
  isRead: boolean
  createdAt: Millis
}

export type DeliveryStatus = 'expected' | 'delivered' | 'cancelled'

export interface Delivery {
  id: string
  residentId: string
  unitId?: string
  apartmentNumber: string
  tower?: string
  vendor: string
  description?: string
  code: string
  status: DeliveryStatus
  deliveredAt?: Millis
  deliveredBy?: string
  createdAt: Millis
}

export interface Camera {
  id: string
  name: string
  location: string
  streamUrl: string
  active: boolean
}

export type MaintenanceStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
export type MaintenanceRecurrence = 'none' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'

export interface MaintenanceTask {
  id: string
  asset: string
  assetLabel: string
  title: string
  description?: string
  provider?: string
  scheduledDate: Millis
  recurrence: MaintenanceRecurrence
  status: MaintenanceStatus
  createdAt: Millis
}
