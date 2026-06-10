import type { Timestamp } from 'firebase/firestore'

// ─── Roles ───────────────────────────────────────────────────────────────────
export type UserRole = 'resident' | 'admin' | 'guard'

// ─── Complex (Edificio / Conjunto) ───────────────────────────────────────────
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
  logoUrl?: string
  towers: string[]
  amenities: Amenity[]
  createdBy: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

// ─── Unit (Apartamento) ───────────────────────────────────────────────────────
export type FeeStatus = 'current' | 'delinquent'

export interface Unit {
  id: string
  tower: string
  number: string
  label: string
  ownerIds: string[]
  ownerNames?: string[]
  feeStatus: FeeStatus
  feePeriod?: string
  feeNotes?: string
  feeUpdatedAt?: Timestamp
  createdAt: Timestamp
  updatedAt: Timestamp
}

// ─── Membership (usuario ↔ edificio) ─────────────────────────────────────────
export interface Membership {
  complexId: string
  complexName: string
  role: UserRole
  unitId?: string
  apartmentNumber?: string
  tower?: string
}

// ─── Invite (código de invitación) ───────────────────────────────────────────
export interface Invite {
  id: string // el código mismo, ej. "PRADO-7X2K"
  complexId: string
  complexName: string
  towers?: string[] // snapshot para el registro (elegir torre/apto sin leer el complex)
  role: UserRole
  unitId?: string
  maxUses: number
  usedCount: number
  expiresAt?: Timestamp
  active: boolean
  createdBy: string
  createdAt: Timestamp
}

// ─── Delivery (Domicilios con código) ────────────────────────────────────────
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
  expectedDate?: Timestamp
  deliveredAt?: Timestamp
  deliveredBy?: string
  notes?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

// ─── Camera (CCTV) ────────────────────────────────────────────────────────────
export interface Camera {
  id: string
  name: string
  location: string
  streamUrl: string
  active: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}

// ─── Maintenance (Mantenimientos programados) ────────────────────────────────
export type MaintenanceStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
export type MaintenanceRecurrence = 'none' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'

export interface MaintenanceTask {
  id: string
  asset: string // 'elevator' | 'pool' | 'general' | amenityId
  assetLabel: string
  title: string
  description?: string
  provider?: string
  scheduledDate: Timestamp
  recurrence: MaintenanceRecurrence
  status: MaintenanceStatus
  createdAt: Timestamp
  updatedAt: Timestamp
}

// ─── User ─────────────────────────────────────────────────────────────────────
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
  /** @deprecated v1 — usar memberships + activeComplexId. Se mantiene por compatibilidad. */
  role: UserRole
  /** @deprecated v1 — usar memberships. */
  complexId: string
  memberships?: Membership[]
  apartmentNumber?: string
  photoUrl?: string
  idNumber: string
  bloodType?: string
  emergencyContact?: EmergencyContact
  idDocumentUrl?: string
  isActive: boolean
  fcmTokens: string[]
  createdAt: Timestamp
  updatedAt: Timestamp
}

// ─── Vehicle ──────────────────────────────────────────────────────────────────
export type VehicleType = 'car' | 'motorcycle' | 'bicycle' | 'truck' | 'other'

export interface Vehicle {
  id: string
  ownerId: string
  apartmentNumber: string
  type: VehicleType
  brand: string
  color: string
  plate: string
  photoUrl?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

// ─── Authorization ────────────────────────────────────────────────────────────
export interface AuthorizedPerson {
  firstName: string
  lastName: string
  idNumber: string
  photoUrl?: string
}

export interface Authorization {
  id: string
  grantedBy: string
  apartmentNumber: string
  person: AuthorizedPerson
  validFrom: Timestamp
  validUntil: Timestamp
  isActive: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}

// ─── Reservation ──────────────────────────────────────────────────────────────
export type CommonArea = 'pool' | 'social_room' | 'court' | 'bbq' | 'gym' | 'other'
export type ReservationStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

export interface Reservation {
  id: string
  residentId: string
  apartmentNumber: string
  title: string
  responsibleName: string
  commonArea: CommonArea
  amenityId?: string
  amenityName?: string
  startDateTime: Timestamp
  endDateTime: Timestamp
  status: ReservationStatus
  adminNotes?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

// ─── Visit ────────────────────────────────────────────────────────────────────
export type VisitType = 'pedestrian' | 'vehicle'

export interface Visit {
  id: string
  type: VisitType
  guardId: string
  apartmentNumber: string
  residentId: string
  visitorName?: string
  visitorIdNumber?: string
  visitorPhotoUrl?: string
  driverName?: string
  vehiclePlate?: string
  vehiclePhotoUrl?: string
  entryTime: Timestamp
  exitTime?: Timestamp
  duration?: number
  notes?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

// ─── News ─────────────────────────────────────────────────────────────────────
export interface News {
  id: string
  authorId: string
  title: string
  body: string
  attachmentUrl?: string
  attachmentType?: 'image' | 'pdf'
  hasAttachment: boolean
  publishedAt: Timestamp
  createdAt: Timestamp
  updatedAt: Timestamp
}

// ─── Circular ─────────────────────────────────────────────────────────────────
export interface Circular {
  id: string
  authorId: string
  title: string
  body: string
  attachmentUrl?: string
  attachmentType?: 'image' | 'pdf'
  hasAttachment: boolean
  publishedAt: Timestamp
  createdAt: Timestamp
  updatedAt: Timestamp
}

// ─── Mail (Correspondencia) ───────────────────────────────────────────────────
export type MailType = 'package' | 'letter' | 'document' | 'other'
export type MailStatus = 'pending' | 'delivered' | 'confirmed'

export interface Mail {
  id: string
  registeredBy: string
  apartmentNumber: string
  residentId: string
  description: string
  type: MailType
  sender?: string
  photoUrl: string
  status: MailStatus
  deliveredAt?: Timestamp
  residentConfirmedExpiry?: Timestamp
  residentConfirmedAt?: Timestamp
  createdAt: Timestamp
  updatedAt: Timestamp
}

// ─── PQR ──────────────────────────────────────────────────────────────────────
export type PQRCategory = 'noise' | 'damage' | 'services' | 'security' | 'admin' | 'other'
export type TicketStatus = 'pending' | 'in_review' | 'resolved'

export interface PQR {
  id: string
  authorId: string
  apartmentNumber: string
  category: PQRCategory
  title: string
  description: string
  attachmentUrls: string[]
  status: TicketStatus
  adminResponse?: string
  resolvedAt?: Timestamp
  resolvedBy?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

// ─── Damage Report ────────────────────────────────────────────────────────────
export interface DamageReport {
  id: string
  authorId: string
  apartmentNumber: string
  title: string
  description: string
  attachmentUrls: string[]
  status: TicketStatus
  adminResponse?: string
  resolvedAt?: Timestamp
  resolvedBy?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

// ─── Notification ─────────────────────────────────────────────────────────────
export type NotificationType =
  | 'visit'
  | 'mail'
  | 'reservation'
  | 'news'
  | 'pqr'
  | 'damage'
  | 'circular'
  | 'delivery'
  | 'maintenance'
  | 'billing'

export interface AppNotification {
  id: string
  recipientId: string
  title: string
  body: string
  type: NotificationType
  relatedDocId: string
  relatedCollection: string
  isRead: boolean
  createdAt: Timestamp
  readAt?: Timestamp
}
