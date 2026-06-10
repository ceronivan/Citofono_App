/**
 * Modelos de datos — port de frontend/src/types/index.ts.
 * En modo demo los timestamps son milisegundos epoch (number) para serializar
 * fácil en AsyncStorage; la capa Firebase real puede convertir Timestamp↔millis.
 */
export type Millis = number

export type UserRole = 'resident' | 'admin' | 'guard'

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
  feeStatus: FeeStatus
  feePeriod?: string
  feeNotes?: string
}

export interface Membership {
  complexId: string
  complexName: string
  role: UserRole
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
  maxUses: number
  usedCount: number
  active: boolean
  createdBy: string
  createdAt: Millis
}

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
  createdAt: Millis
}

export interface Authorization {
  id: string
  grantedBy: string
  apartmentNumber: string
  person: { firstName: string; lastName: string; idNumber: string; photoUrl?: string }
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
  title: string
  description: string
  status: TicketStatus
  adminResponse?: string
  createdAt: Millis
}

export type NotificationType =
  | 'visit' | 'mail' | 'reservation' | 'news' | 'pqr'
  | 'damage' | 'circular' | 'delivery' | 'maintenance' | 'billing'

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
