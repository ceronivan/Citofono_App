/**
 * Datos DEMO de PortalResidencial.
 *
 * Mundo demo:
 *  - "Conjunto El Prado"  (demo-prado)   — 2 torres, 20 aptos, todos los módulos poblados
 *  - "Edificio Mirador"   (demo-mirador) — segundo edificio del admin (muestra el switcher)
 *
 * Cuentas (cualquier contraseña sirve):
 *  - admin@demo.com      → admin de ambos edificios
 *  - residente@demo.com  → residente Torre A · 101 de El Prado
 *  - portero@demo.com    → portería de El Prado
 */
import { docs, Timestamp } from './mock-db'

const PRADO = 'demo-prado'
const MIRADOR = 'demo-mirador'

const U_ADMIN = 'u-admin'
const U_RES = 'u-res'
const U_GUARD = 'u-guard'

function daysAgo(n: number, h = 10) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(h, 0, 0, 0)
  return Timestamp.fromDate(d)
}
function daysFromNow(n: number, h = 10) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  d.setHours(h, 0, 0, 0)
  return Timestamp.fromDate(d)
}
function hoursAgo(n: number) {
  return Timestamp.fromMillis(Date.now() - n * 3600_000)
}

let counter = 0
function put(path: string, data: Record<string, unknown>) {
  docs.set(path, { createdAt: hoursAgo(72), updatedAt: hoursAgo(72), ...data })
}
function add(colPath: string, data: Record<string, unknown>) {
  put(`${colPath}/seed-${++counter}`, data)
}

export function seedDemoData() {
  // ─── Cuentas de auth ────────────────────────────────────────────────────────
  docs.set('__auth/admin@demo.com', { uid: U_ADMIN })
  docs.set('__auth/residente@demo.com', { uid: U_RES })
  docs.set('__auth/portero@demo.com', { uid: U_GUARD })

  // ─── Perfiles de usuario ────────────────────────────────────────────────────
  put(`users/${U_ADMIN}`, {
    email: 'admin@demo.com',
    firstName: 'Patricia',
    lastName: 'Mendoza',
    phone: '3001112233',
    idNumber: '52888999',
    role: 'admin',
    complexId: PRADO,
    memberships: [
      { complexId: PRADO, complexName: 'Conjunto El Prado', role: 'admin' },
      { complexId: MIRADOR, complexName: 'Edificio Mirador', role: 'admin' },
    ],
    photoUrl: 'https://i.pravatar.cc/200?img=47',
    isActive: true,
    fcmTokens: [],
  })

  put(`users/${U_RES}`, {
    email: 'residente@demo.com',
    firstName: 'Iván',
    lastName: 'Cerón',
    phone: '3014445566',
    idNumber: '1020304050',
    role: 'resident',
    complexId: PRADO,
    apartmentNumber: '101',
    memberships: [
      {
        complexId: PRADO,
        complexName: 'Conjunto El Prado',
        role: 'resident',
        unitId: 'torre-a_101',
        apartmentNumber: '101',
        tower: 'Torre A',
      },
    ],
    bloodType: 'O+',
    emergencyContact: { name: 'Laura Cerón', phone: '3017778899', relationship: 'Hermana' },
    photoUrl: 'https://i.pravatar.cc/200?img=12',
    isActive: true,
    fcmTokens: [],
  })

  put(`users/${U_GUARD}`, {
    email: 'portero@demo.com',
    firstName: 'Jorge',
    lastName: 'Ramírez',
    phone: '3109998877',
    idNumber: '79555444',
    role: 'guard',
    complexId: PRADO,
    memberships: [
      { complexId: PRADO, complexName: 'Conjunto El Prado', role: 'guard' },
    ],
    photoUrl: 'https://i.pravatar.cc/200?img=68',
    isActive: true,
    fcmTokens: [],
  })

  // ─── Conjunto El Prado ──────────────────────────────────────────────────────
  put(`complexes/${PRADO}`, {
    name: 'Conjunto El Prado',
    address: 'Calle 123 # 45-67',
    city: 'Bogotá',
    phone: '601 234 5678',
    email: 'admin@elprado.co',
    logoUrl: '',
    towers: ['Torre A', 'Torre B'],
    amenities: [
      { id: 'social_room', name: 'Salón Social', icon: 'mdi-party-popper', requiresApproval: true, blockIfDelinquent: true, active: true },
      { id: 'pool', name: 'Piscina', icon: 'mdi-pool', requiresApproval: true, blockIfDelinquent: true, active: true },
      { id: 'bbq', name: 'Zona BBQ', icon: 'mdi-grill-outline', requiresApproval: true, blockIfDelinquent: true, active: true },
      { id: 'gym', name: 'Gimnasio', icon: 'mdi-dumbbell', requiresApproval: false, blockIfDelinquent: true, active: true },
      { id: 'court', name: 'Cancha', icon: 'mdi-basketball', requiresApproval: true, blockIfDelinquent: false, active: true },
    ],
    createdBy: U_ADMIN,
  })

  // Unidades: 2 torres × 5 pisos × 2 aptos
  const owners: Record<string, { ids: string[]; names: string[] }> = {
    'torre-a_101': { ids: [U_RES], names: ['Iván Cerón'] },
    'torre-a_202': { ids: ['u-otro1'], names: ['Carolina Reyes'] },
    'torre-a_302': { ids: ['u-otro2'], names: ['Andrés Patiño'] },
    'torre-b_201': { ids: ['u-otro3'], names: ['Sofía Lemus'] },
  }
  for (const tower of ['Torre A', 'Torre B']) {
    for (let floor = 1; floor <= 5; floor++) {
      for (let u = 1; u <= 2; u++) {
        const number = `${floor}${String(u).padStart(2, '0')}`
        const id = `${tower.replace(/\s+/g, '-')}_${number}`.toLowerCase()
        const delinquent = id === 'torre-a_201' || id === 'torre-a_302'
        put(`complexes/${PRADO}/units/${id}`, {
          tower,
          number,
          label: `${tower} · ${number}`,
          ownerIds: owners[id]?.ids ?? [],
          ownerNames: owners[id]?.names ?? [],
          feeStatus: delinquent ? 'delinquent' : 'current',
          ...(delinquent ? { feePeriod: '2026-06', feeNotes: 'Mora de 2 meses', feeUpdatedAt: daysAgo(5) } : {}),
        })
      }
    }
  }

  const prado = (col: string) => `complexes/${PRADO}/${col}`

  // Vehículos del residente
  add(prado('vehicles'), {
    ownerId: U_RES, apartmentNumber: '101', type: 'car',
    brand: 'Mazda', color: 'Gris', plate: 'KJM482',
    photoUrl: 'https://picsum.photos/seed/car1/400/300',
  })
  add(prado('vehicles'), {
    ownerId: U_RES, apartmentNumber: '101', type: 'bicycle',
    brand: 'Specialized', color: 'Negra', plate: '—',
    photoUrl: 'https://picsum.photos/seed/bike1/400/300',
  })

  // Autorizaciones
  add(prado('authorizations'), {
    grantedBy: U_RES, apartmentNumber: '101',
    person: { firstName: 'Marcela', lastName: 'Ortiz', idNumber: '1015987654', photoUrl: 'https://i.pravatar.cc/200?img=31' },
    validFrom: daysAgo(2), validUntil: daysFromNow(28), isActive: true,
  })
  add(prado('authorizations'), {
    grantedBy: U_RES, apartmentNumber: '101',
    person: { firstName: 'Camilo', lastName: 'Vargas', idNumber: '80123456', photoUrl: 'https://i.pravatar.cc/200?img=53' },
    validFrom: daysAgo(40), validUntil: daysAgo(10), isActive: false,
  })

  // Reservas
  add(prado('reservations'), {
    residentId: U_RES, apartmentNumber: '101',
    title: 'Cumpleaños de Sara', responsibleName: 'Iván Cerón',
    commonArea: 'social_room', amenityId: 'social_room', amenityName: 'Salón Social',
    startDateTime: daysFromNow(6, 15), endDateTime: daysFromNow(6, 21),
    status: 'approved', adminNotes: 'Recuerda la fianza de $100.000',
  })
  add(prado('reservations'), {
    residentId: U_RES, apartmentNumber: '101',
    title: 'Asado familiar', responsibleName: 'Iván Cerón',
    commonArea: 'bbq', amenityId: 'bbq', amenityName: 'Zona BBQ',
    startDateTime: daysFromNow(12, 12), endDateTime: daysFromNow(12, 17),
    status: 'pending',
  })
  add(prado('reservations'), {
    residentId: 'u-otro1', apartmentNumber: '202',
    title: 'Clase de natación', responsibleName: 'Carolina Reyes',
    commonArea: 'pool', amenityId: 'pool', amenityName: 'Piscina',
    startDateTime: daysFromNow(2, 8), endDateTime: daysFromNow(2, 10),
    status: 'pending',
  })

  // Visitas
  add(prado('visits'), {
    type: 'pedestrian', guardId: U_GUARD, apartmentNumber: '101', residentId: U_RES,
    visitorName: 'Carlos Gómez', visitorPhotoUrl: 'https://i.pravatar.cc/200?img=15',
    entryTime: hoursAgo(2), exitTime: null,
  })
  add(prado('visits'), {
    type: 'pedestrian', guardId: U_GUARD, apartmentNumber: '101', residentId: U_RES,
    visitorName: 'María Rodríguez', visitorPhotoUrl: 'https://i.pravatar.cc/200?img=24',
    entryTime: daysAgo(1, 16), exitTime: daysAgo(1, 18), duration: 120,
  })
  add(prado('visits'), {
    type: 'vehicle', guardId: U_GUARD, apartmentNumber: '101', residentId: U_RES,
    driverName: 'Pedro Sánchez', vehiclePlate: 'ABC123',
    vehiclePhotoUrl: 'https://picsum.photos/seed/visit-car/400/300',
    entryTime: daysAgo(2, 11), exitTime: daysAgo(2, 14), duration: 180,
  })
  add(prado('visits'), {
    type: 'pedestrian', guardId: U_GUARD, apartmentNumber: '202', residentId: 'u-otro1',
    visitorName: 'Ana Torres', entryTime: daysAgo(3, 9), exitTime: daysAgo(3, 10), duration: 45,
  })
  add(prado('visits'), {
    type: 'vehicle', guardId: U_GUARD, apartmentNumber: '302', residentId: 'u-otro2',
    driverName: 'Luisa Díaz', vehiclePlate: 'XYZ789',
    entryTime: daysAgo(4, 18), exitTime: daysAgo(4, 19), duration: 60,
  })

  // Noticias
  add(prado('news'), {
    authorId: U_ADMIN,
    title: 'Asamblea General de Propietarios',
    body: 'Estimados propietarios y residentes,\n\nLa Asamblea General Ordinaria se realizará el sábado a las 10:00 a.m. en el salón social.\n\nORDEN DEL DÍA:\n1. Verificación del quórum\n2. Informe de gestión\n3. Aprobación presupuesto\n4. Elección del Consejo de Administración\n\nSe ruega puntual asistencia.',
    hasAttachment: false, publishedAt: daysAgo(2),
  })
  add(prado('news'), {
    authorId: U_ADMIN,
    title: 'Corte de agua programado',
    body: 'El miércoles habrá corte de agua de 8:00 a.m. a 3:00 p.m. por mantenimiento preventivo de la red de tuberías. Recomendamos almacenar suficiente agua.\n\nAdministración.',
    hasAttachment: false, publishedAt: daysAgo(5),
  })
  add(prado('news'), {
    authorId: U_ADMIN,
    title: 'Celebración Día de la Familia',
    body: '¡Los invitamos a celebrar el Día de la Familia!\n\n📍 Zonas comunes\n🕓 Sábado 4:00 p.m.\n🎂 Torta y refrigerio\n🎁 Rifa de premios\n\n¡No falten!',
    hasAttachment: true, attachmentType: 'image',
    attachmentUrl: 'https://picsum.photos/seed/fiesta/800/400',
    publishedAt: daysAgo(9),
  })

  // Circulares
  add(prado('circulars'), {
    authorId: U_ADMIN,
    title: 'Circular 01 — Normas de parqueadero',
    body: 'La administración recuerda:\n\n1. Cada apto tiene asignado su parqueadero.\n2. Prohibido parquear en espacios ajenos.\n3. Visitantes solo en zonas amarillas.\n4. No lavar vehículos dentro del conjunto.',
    hasAttachment: false, publishedAt: daysAgo(3),
  })
  add(prado('circulars'), {
    authorId: U_ADMIN,
    title: 'Circular 02 — Política de mascotas',
    body: 'En cumplimiento del Código de Policía:\n\n• Mascotas siempre con correa en áreas comunes.\n• Obligatorio recoger excrementos.\n• Sin acceso a piscina, salón social ni cancha.',
    hasAttachment: false, publishedAt: daysAgo(12),
  })

  // Correspondencia (apto 101)
  add(prado('mail'), {
    registeredBy: U_GUARD, apartmentNumber: '101', residentId: U_RES,
    description: 'Paquete de Amazon — Electrónica', type: 'package', sender: 'Amazon',
    photoUrl: 'https://picsum.photos/seed/pkg1/400/300', status: 'pending',
  })
  add(prado('mail'), {
    registeredBy: U_GUARD, apartmentNumber: '101', residentId: U_RES,
    description: 'Carta certificada Bancolombia', type: 'letter', sender: 'Bancolombia',
    photoUrl: 'https://picsum.photos/seed/pkg2/400/300', status: 'delivered',
    deliveredAt: daysAgo(1), residentConfirmedExpiry: daysFromNow(4),
  })
  add(prado('mail'), {
    registeredBy: U_GUARD, apartmentNumber: '101', residentId: U_RES,
    description: 'Documentos notaría', type: 'document', sender: 'Notaría 12',
    photoUrl: 'https://picsum.photos/seed/pkg3/400/300', status: 'confirmed',
    deliveredAt: daysAgo(8), residentConfirmedAt: daysAgo(7),
  })

  // Domicilios — códigos activos: 4821 (pizza) y 7350 (mercado)
  add(prado('deliveries'), {
    residentId: U_RES, unitId: 'torre-a_101', apartmentNumber: '101', tower: 'Torre A',
    vendor: 'Pizza', description: "Pizza grande pepperoni — Domino's",
    code: '4821', status: 'expected',
  })
  add(prado('deliveries'), {
    residentId: U_RES, unitId: 'torre-a_101', apartmentNumber: '101', tower: 'Torre A',
    vendor: 'Mercado', description: 'Mercado Rappi — 2 bolsas',
    code: '7350', status: 'expected',
  })
  add(prado('deliveries'), {
    residentId: U_RES, unitId: 'torre-a_101', apartmentNumber: '101', tower: 'Torre A',
    vendor: 'Farmacia', description: 'Droguería Cruz Verde',
    code: '1199', status: 'delivered', deliveredAt: daysAgo(1), deliveredBy: U_GUARD,
  })

  // Cámaras (streams de demostración)
  add(prado('cameras'), {
    name: 'CAM 01 — Lobby', location: 'Entrada principal',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', active: true,
  })
  add(prado('cameras'), {
    name: 'CAM 02 — Parqueadero', location: 'Sótano 1',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', active: true,
  })
  add(prado('cameras'), {
    name: 'CAM 03 — Piscina', location: 'Zona húmeda',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', active: true,
  })
  add(prado('cameras'), {
    name: 'CAM 04 — Ascensor Torre A', location: 'Torre A', streamUrl: '', active: false,
  })

  // Mantenimientos
  add(prado('maintenances'), {
    asset: 'elevator', assetLabel: 'Ascensor', title: 'Mantenimiento preventivo mensual',
    description: '', provider: 'Ascensores Schindler',
    scheduledDate: daysFromNow(3, 9), recurrence: 'monthly', status: 'scheduled',
  })
  add(prado('maintenances'), {
    asset: 'pool', assetLabel: 'Piscina', title: 'Tratamiento químico del agua',
    description: '', provider: 'AquaClean',
    scheduledDate: daysFromNow(1, 7), recurrence: 'weekly', status: 'in_progress',
  })
  add(prado('maintenances'), {
    asset: 'general', assetLabel: 'Zonas comunes', title: 'Fumigación general',
    description: 'Torres A y B, sótanos y shut de basuras', provider: 'FumiHogar',
    scheduledDate: daysFromNow(10, 8), recurrence: 'quarterly', status: 'scheduled',
  })
  add(prado('maintenances'), {
    asset: 'elevator', assetLabel: 'Ascensor', title: 'Cambio de cables de tracción',
    description: '', provider: 'Ascensores Schindler',
    scheduledDate: daysAgo(15), recurrence: 'none', status: 'completed',
  })

  // PQRs
  add(prado('pqrs'), {
    authorId: U_RES, apartmentNumber: '101', category: 'noise',
    title: 'Ruido excesivo en el 201',
    description: 'Desde hace una semana el apartamento 201 hace fiestas entre semana hasta las 2 a.m. Solicito que la administración tome medidas.',
    attachmentUrls: [], status: 'pending',
  })
  add(prado('pqrs'), {
    authorId: U_RES, apartmentNumber: '101', category: 'services',
    title: 'Citófono dañado',
    description: 'El citófono del apto no timbra desde el viernes.',
    attachmentUrls: [], status: 'resolved',
    adminResponse: 'Se realizó el cambio del citófono el lunes. Quedamos atentos.',
    resolvedAt: daysAgo(2), resolvedBy: U_ADMIN,
  })

  // Reporte de daños
  add(prado('damageReports'), {
    authorId: U_RES, apartmentNumber: '101',
    title: 'Luminaria dañada en pasillo piso 1',
    description: 'La lámpara del pasillo frente al apto 101 parpadea y se apaga por las noches.',
    attachmentUrls: ['https://picsum.photos/seed/lamp/400/300'], status: 'in_review',
  })

  // Notificaciones del residente
  add(prado('notifications'), {
    recipientId: U_RES, title: '🛵 Domicilio entregado',
    body: 'Tu pedido de Droguería Cruz Verde fue autorizado en portería.',
    type: 'delivery', relatedDocId: '', relatedCollection: 'deliveries',
    isRead: false, createdAt: hoursAgo(20),
  })
  add(prado('notifications'), {
    recipientId: U_RES, title: '📦 Nueva correspondencia',
    body: 'Paquete de Amazon te espera en portería.',
    type: 'mail', relatedDocId: '', relatedCollection: 'mail',
    isRead: false, createdAt: hoursAgo(5),
  })
  add(prado('notifications'), {
    recipientId: U_RES, title: '✅ Reserva aprobada',
    body: 'Tu reserva del Salón Social fue aprobada por la administración.',
    type: 'reservation', relatedDocId: '', relatedCollection: 'reservations',
    isRead: true, createdAt: daysAgo(1), readAt: daysAgo(1, 12),
  })
  add(prado('notifications'), {
    recipientId: U_RES, title: '🔧 Mantenimiento programado',
    body: 'La piscina estará cerrada mañana por tratamiento del agua.',
    type: 'maintenance', relatedDocId: '', relatedCollection: 'maintenances',
    isRead: true, createdAt: daysAgo(2), readAt: daysAgo(2, 15),
  })

  // Invitaciones
  put('invites/PRADO-DEMO', {
    complexId: PRADO, complexName: 'Conjunto El Prado',
    towers: ['Torre A', 'Torre B'], role: 'resident',
    maxUses: 0, usedCount: 3, active: true, createdBy: U_ADMIN,
  })
  put('invites/PRADO-GUARD', {
    complexId: PRADO, complexName: 'Conjunto El Prado',
    towers: ['Torre A', 'Torre B'], role: 'guard',
    maxUses: 5, usedCount: 1, active: true, createdBy: U_ADMIN,
  })

  // ─── Edificio Mirador (segundo edificio del admin) ──────────────────────────
  put(`complexes/${MIRADOR}`, {
    name: 'Edificio Mirador',
    address: 'Carrera 7 # 85-21',
    city: 'Bogotá',
    phone: '601 765 4321',
    email: 'admin@mirador.co',
    logoUrl: '',
    towers: ['Única'],
    amenities: [
      { id: 'terrace', name: 'Terraza BBQ', icon: 'mdi-weather-sunny', requiresApproval: true, blockIfDelinquent: true, active: true },
      { id: 'coworking', name: 'Coworking', icon: 'mdi-laptop', requiresApproval: false, blockIfDelinquent: true, active: true },
    ],
    createdBy: U_ADMIN,
  })
  for (let floor = 1; floor <= 3; floor++) {
    for (let u = 1; u <= 2; u++) {
      const number = `${floor}${String(u).padStart(2, '0')}`
      put(`complexes/${MIRADOR}/units/unica_${number}`, {
        tower: 'Única', number, label: number,
        ownerIds: [], ownerNames: [],
        feeStatus: floor === 2 && u === 1 ? 'delinquent' : 'current',
      })
    }
  }
  add(`complexes/${MIRADOR}/news`, {
    authorId: U_ADMIN,
    title: 'Bienvenidos a la app del Mirador',
    body: 'A partir de hoy toda la comunicación del edificio se gestiona por PortalResidencial.',
    hasAttachment: false, publishedAt: daysAgo(1),
  })
  add(`complexes/${MIRADOR}/cameras`, {
    name: 'CAM 01 — Recepción', location: 'Lobby',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4', active: true,
  })
  put('invites/MIRA-DEMO', {
    complexId: MIRADOR, complexName: 'Edificio Mirador',
    towers: ['Única'], role: 'resident',
    maxUses: 0, usedCount: 0, active: true, createdBy: U_ADMIN,
  })
}
