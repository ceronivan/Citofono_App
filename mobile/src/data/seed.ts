/**
 * Datos DEMO — mismo mundo que la versión Vue:
 *  - "Conjunto El Prado"  (demo-prado)   — 2 torres, 20 aptos, todos los módulos
 *  - "Edificio Mirador"   (demo-mirador) — segundo edificio del admin
 *
 * Cuentas (cualquier contraseña):
 *  admin@demo.com · residente@demo.com (propietario residente) · portero@demo.com
 *  propietario@demo.com (dueño que NO habita, Torre B 101)
 *  habitante@demo.com   (arrendatario de Torre B 101)
 */

const PRADO = 'demo-prado'
const MIRADOR = 'demo-mirador'
const U_ADMIN = 'u-admin'
const U_RES = 'u-res'
const U_GUARD = 'u-guard'
const U_OWNER = 'u-owner'
const U_TENANT = 'u-tenant'

const day = 24 * 3600_000
const now = Date.now()
const daysAgo = (n: number) => now - n * day
const daysFromNow = (n: number) => now + n * day
const hoursAgo = (n: number) => now - n * 3600_000

let counter = 0
const id = () => `seed-${++counter}`

export function seedDemoData(): Record<string, ({ id: string } & Record<string, unknown>)[]> {
  const db: Record<string, ({ id: string } & Record<string, unknown>)[]> = {}
  const push = (key: string, row: Record<string, unknown>) => {
    ;(db[key] ??= []).push({ id: id(), createdAt: hoursAgo(72), ...row } as { id: string } & Record<string, unknown>)
  }

  // ─── Cuentas y usuarios ─────────────────────────────────────────────────────
  push('authAccounts', { id: 'admin@demo.com', uid: U_ADMIN })
  push('authAccounts', { id: 'residente@demo.com', uid: U_RES })
  push('authAccounts', { id: 'portero@demo.com', uid: U_GUARD })
  push('authAccounts', { id: 'propietario@demo.com', uid: U_OWNER })
  push('authAccounts', { id: 'habitante@demo.com', uid: U_TENANT })

  push('users', {
    id: U_ADMIN, email: 'admin@demo.com', firstName: 'Patricia', lastName: 'Mendoza',
    phone: '3001112233', idNumber: '52888999', isActive: true,
    photoUrl: 'https://i.pravatar.cc/200?img=47',
    memberships: [
      { complexId: PRADO, complexName: 'Conjunto El Prado', role: 'admin' },
      { complexId: MIRADOR, complexName: 'Edificio Mirador', role: 'admin' },
    ],
  })
  push('users', {
    id: U_RES, email: 'residente@demo.com', firstName: 'Iván', lastName: 'Cerón',
    phone: '3014445566', idNumber: '1020304050', isActive: true,
    apartmentNumber: '101', bloodType: 'O+',
    emergencyContact: { name: 'Laura Cerón', phone: '3017778899', relationship: 'Hermana' },
    photoUrl: 'https://i.pravatar.cc/200?img=12',
    memberships: [
      { complexId: PRADO, complexName: 'Conjunto El Prado', role: 'resident', residentType: 'owner_resident', unitId: 'torre-a_101', apartmentNumber: '101', tower: 'Torre A' },
    ],
  })
  push('users', {
    id: U_OWNER, email: 'propietario@demo.com', firstName: 'Gloria', lastName: 'Pardo',
    phone: '3025556677', idNumber: '41222333', isActive: true,
    photoUrl: 'https://i.pravatar.cc/200?img=44',
    memberships: [
      { complexId: PRADO, complexName: 'Conjunto El Prado', role: 'resident', residentType: 'owner', unitId: 'torre-b_101', apartmentNumber: '101', tower: 'Torre B' },
    ],
  })
  push('users', {
    id: U_TENANT, email: 'habitante@demo.com', firstName: 'Felipe', lastName: 'Rojas',
    phone: '3168889900', idNumber: '1030405060', isActive: true,
    apartmentNumber: '101',
    photoUrl: 'https://i.pravatar.cc/200?img=15',
    memberships: [
      { complexId: PRADO, complexName: 'Conjunto El Prado', role: 'resident', residentType: 'tenant', unitId: 'torre-b_101', apartmentNumber: '101', tower: 'Torre B' },
    ],
  })
  push('users', {
    id: U_GUARD, email: 'portero@demo.com', firstName: 'Jorge', lastName: 'Ramírez',
    phone: '3109998877', idNumber: '79555444', isActive: true,
    photoUrl: 'https://i.pravatar.cc/200?img=68',
    memberships: [
      { complexId: PRADO, complexName: 'Conjunto El Prado', role: 'guard' },
    ],
  })

  // ─── Conjunto El Prado ──────────────────────────────────────────────────────
  push('complexes', {
    id: PRADO, name: 'Conjunto El Prado', address: 'Calle 123 # 45-67', city: 'Bogotá',
    phone: '601 234 5678', email: 'admin@elprado.co', createdBy: U_ADMIN,
    towers: ['Torre A', 'Torre B'],
    amenities: [
      { id: 'social_room', name: 'Salón Social', icon: 'party-popper', requiresApproval: true, blockIfDelinquent: true, active: true },
      { id: 'pool', name: 'Piscina', icon: 'pool', requiresApproval: true, blockIfDelinquent: true, active: true },
      { id: 'bbq', name: 'Zona BBQ', icon: 'grill-outline', requiresApproval: true, blockIfDelinquent: true, active: true },
      { id: 'gym', name: 'Gimnasio', icon: 'dumbbell', requiresApproval: false, blockIfDelinquent: true, active: true },
      { id: 'court', name: 'Cancha', icon: 'basketball', requiresApproval: true, blockIfDelinquent: false, active: true },
    ],
  })

  const owners: Record<string, { ids: string[]; names: string[] }> = {
    'torre-a_101': { ids: [U_RES], names: ['Iván Cerón'] },
    'torre-a_202': { ids: ['u-otro1'], names: ['Carolina Reyes'] },
    'torre-a_302': { ids: ['u-otro2'], names: ['Andrés Patiño'] },
    'torre-b_101': { ids: [U_OWNER], names: ['Gloria Pardo'] },
    'torre-b_201': { ids: ['u-otro3'], names: ['Sofía Lemus'] },
  }
  // Unidad arrendada: la dueña no vive ahí; Felipe la habita
  const tenants: Record<string, { ids: string[]; names: string[] }> = {
    'torre-b_101': { ids: [U_TENANT], names: ['Felipe Rojas'] },
  }
  for (const tower of ['Torre A', 'Torre B']) {
    for (let floor = 1; floor <= 5; floor++) {
      for (let u = 1; u <= 2; u++) {
        const number = `${floor}${String(u).padStart(2, '0')}`
        const unitId = `${tower.replace(/\s+/g, '-')}_${number}`.toLowerCase()
        const delinquent = unitId === 'torre-a_201' || unitId === 'torre-a_302'
        push(`${PRADO}/units`, {
          id: unitId, tower, number, label: `${tower} · ${number}`,
          ownerIds: owners[unitId]?.ids ?? [], ownerNames: owners[unitId]?.names ?? [],
          tenantIds: tenants[unitId]?.ids ?? [], tenantNames: tenants[unitId]?.names ?? [],
          feeStatus: delinquent ? 'delinquent' : 'current',
          ...(delinquent ? { feePeriod: '2026-06', feeNotes: 'Mora de 2 meses' } : {}),
        })
      }
    }
  }

  // Vehículos (pertenecen a la unidad; los registra el propietario)
  push(`${PRADO}/vehicles`, {
    ownerId: U_RES, unitId: 'torre-a_101', tower: 'Torre A', apartmentNumber: '101',
    type: 'car', brand: 'Mazda', color: 'Gris',
    plate: 'KJM482', photoUrl: 'https://picsum.photos/seed/car1/400/300',
  })
  push(`${PRADO}/vehicles`, {
    ownerId: U_RES, unitId: 'torre-a_101', tower: 'Torre A', apartmentNumber: '101',
    type: 'bicycle', brand: 'Specialized', color: 'Negra',
    plate: '—', photoUrl: 'https://picsum.photos/seed/bike1/400/300',
  })
  // Gloria (dueña que no habita) registró la moto de su arrendatario Felipe
  push(`${PRADO}/vehicles`, {
    ownerId: U_OWNER, unitId: 'torre-b_101', tower: 'Torre B', apartmentNumber: '101',
    type: 'motorcycle', brand: 'Yamaha FZ', color: 'Azul',
    plate: 'TRD25C', photoUrl: 'https://picsum.photos/seed/moto1/400/300',
  })

  // Autorizaciones
  push(`${PRADO}/authorizations`, {
    type: 'person', grantedBy: U_RES, apartmentNumber: '101', tower: 'Torre A',
    person: { firstName: 'Marcela', lastName: 'Ortiz', idNumber: '1015987654', photoUrl: 'https://i.pravatar.cc/200?img=31' },
    validFrom: daysAgo(2), validUntil: daysFromNow(28),
  })
  push(`${PRADO}/authorizations`, {
    type: 'person', grantedBy: U_RES, apartmentNumber: '101', tower: 'Torre A',
    person: { firstName: 'Camilo', lastName: 'Vargas', idNumber: '80123456', photoUrl: 'https://i.pravatar.cc/200?img=53' },
    validFrom: daysAgo(40), validUntil: daysAgo(10),
  })
  // Felipe (habitante) autorizó el carro de un visitante por el fin de semana
  push(`${PRADO}/authorizations`, {
    type: 'vehicle', grantedBy: U_TENANT, apartmentNumber: '101', tower: 'Torre B',
    vehicle: { plate: 'GHK913', description: 'Renault Logan blanco — visita de fin de semana' },
    validFrom: daysAgo(1), validUntil: daysFromNow(2),
  })

  // Multas y llamados de atención (los ven dueño Y habitante de la unidad)
  push(`${PRADO}/sanctions`, {
    unitId: 'torre-b_101', tower: 'Torre B', apartmentNumber: '101',
    type: 'fine', title: 'Multa por ruido excesivo',
    description: 'Fiesta con volumen alto el sábado pasadas las 11 p.m. (Reglamento art. 12).',
    amount: 200000, status: 'pending', issuedBy: U_ADMIN, createdAt: daysAgo(4),
  })
  push(`${PRADO}/sanctions`, {
    unitId: 'torre-b_101', tower: 'Torre B', apartmentNumber: '101',
    type: 'warning', title: 'Llamado de atención — mascota sin correa',
    description: 'Se observó al perro de la unidad sin correa en zonas comunes.',
    issuedBy: U_ADMIN, createdAt: daysAgo(10),
  })
  push(`${PRADO}/sanctions`, {
    unitId: 'torre-a_101', tower: 'Torre A', apartmentNumber: '101',
    type: 'fine', title: 'Multa por parqueo en zona de visitantes',
    description: 'Vehículo KJM482 ocupó la zona amarilla por 2 días.',
    amount: 80000, status: 'paid', issuedBy: U_ADMIN, createdAt: daysAgo(20),
  })

  // Reservas
  push(`${PRADO}/reservations`, {
    residentId: U_RES, apartmentNumber: '101', title: 'Cumpleaños de Sara', responsibleName: 'Iván Cerón',
    amenityId: 'social_room', amenityName: 'Salón Social',
    startDateTime: daysFromNow(6), endDateTime: daysFromNow(6) + 6 * 3600_000,
    status: 'approved', adminNotes: 'Recuerda la fianza de $100.000',
  })
  push(`${PRADO}/reservations`, {
    residentId: U_RES, apartmentNumber: '101', title: 'Asado familiar', responsibleName: 'Iván Cerón',
    amenityId: 'bbq', amenityName: 'Zona BBQ',
    startDateTime: daysFromNow(12), endDateTime: daysFromNow(12) + 5 * 3600_000,
    status: 'pending',
  })
  push(`${PRADO}/reservations`, {
    residentId: 'u-otro1', apartmentNumber: '202', title: 'Clase de natación', responsibleName: 'Carolina Reyes',
    amenityId: 'pool', amenityName: 'Piscina',
    startDateTime: daysFromNow(2), endDateTime: daysFromNow(2) + 2 * 3600_000,
    status: 'pending',
  })

  // Visitas
  push(`${PRADO}/visits`, {
    type: 'pedestrian', guardId: U_GUARD, apartmentNumber: '101', residentId: U_RES,
    visitorName: 'Carlos Gómez', entryTime: hoursAgo(2), exitTime: null,
  })
  push(`${PRADO}/visits`, {
    type: 'pedestrian', guardId: U_GUARD, apartmentNumber: '101', residentId: U_RES,
    visitorName: 'María Rodríguez', entryTime: daysAgo(1), exitTime: daysAgo(1) + 2 * 3600_000, duration: 120,
  })
  push(`${PRADO}/visits`, {
    type: 'vehicle', guardId: U_GUARD, apartmentNumber: '101', residentId: U_RES,
    driverName: 'Pedro Sánchez', vehiclePlate: 'ABC123',
    entryTime: daysAgo(2), exitTime: daysAgo(2) + 3 * 3600_000, duration: 180,
  })
  push(`${PRADO}/visits`, {
    type: 'pedestrian', guardId: U_GUARD, apartmentNumber: '202',
    visitorName: 'Ana Torres', entryTime: daysAgo(3), exitTime: daysAgo(3) + 45 * 60_000, duration: 45,
  })
  push(`${PRADO}/visits`, {
    type: 'vehicle', guardId: U_GUARD, apartmentNumber: '302',
    driverName: 'Luisa Díaz', vehiclePlate: 'XYZ789',
    entryTime: daysAgo(4), exitTime: daysAgo(4) + 3600_000, duration: 60,
  })

  // Noticias
  push(`${PRADO}/news`, {
    authorId: U_ADMIN, title: 'Asamblea General de Propietarios',
    body: 'Estimados propietarios y residentes,\n\nLa Asamblea General Ordinaria se realizará el sábado a las 10:00 a.m. en el salón social.\n\nORDEN DEL DÍA:\n1. Verificación del quórum\n2. Informe de gestión\n3. Aprobación presupuesto\n4. Elección del Consejo de Administración\n\nSe ruega puntual asistencia.',
    hasAttachment: false, publishedAt: daysAgo(2),
  })
  push(`${PRADO}/news`, {
    authorId: U_ADMIN, title: 'Corte de agua programado',
    body: 'El miércoles habrá corte de agua de 8:00 a.m. a 3:00 p.m. por mantenimiento preventivo de la red de tuberías. Recomendamos almacenar suficiente agua.\n\nAdministración.',
    hasAttachment: false, publishedAt: daysAgo(5),
  })
  push(`${PRADO}/news`, {
    authorId: U_ADMIN, title: 'Celebración Día de la Familia',
    body: '¡Los invitamos a celebrar el Día de la Familia!\n\n📍 Zonas comunes\n🕓 Sábado 4:00 p.m.\n🎂 Torta y refrigerio\n🎁 Rifa de premios\n\n¡No falten!',
    hasAttachment: true, attachmentUrl: 'https://picsum.photos/seed/fiesta/800/400', publishedAt: daysAgo(9),
  })

  // Circulares
  push(`${PRADO}/circulars`, {
    authorId: U_ADMIN, title: 'Circular 01 — Normas de parqueadero',
    body: 'La administración recuerda:\n\n1. Cada apto tiene asignado su parqueadero.\n2. Prohibido parquear en espacios ajenos.\n3. Visitantes solo en zonas amarillas.\n4. No lavar vehículos dentro del conjunto.',
    hasAttachment: false, publishedAt: daysAgo(3),
  })
  push(`${PRADO}/circulars`, {
    authorId: U_ADMIN, title: 'Circular 02 — Política de mascotas',
    body: 'En cumplimiento del Código de Policía:\n\n• Mascotas siempre con correa en áreas comunes.\n• Obligatorio recoger excrementos.\n• Sin acceso a piscina, salón social ni cancha.',
    hasAttachment: false, publishedAt: daysAgo(12),
  })

  // Correspondencia
  push(`${PRADO}/mail`, {
    registeredBy: U_GUARD, apartmentNumber: '101', residentId: U_RES,
    description: 'Paquete de Amazon — Electrónica', type: 'package', sender: 'Amazon',
    photoUrl: 'https://picsum.photos/seed/pkg1/400/300', status: 'pending',
  })
  push(`${PRADO}/mail`, {
    registeredBy: U_GUARD, apartmentNumber: '101', residentId: U_RES,
    description: 'Carta certificada Bancolombia', type: 'letter', sender: 'Bancolombia',
    photoUrl: 'https://picsum.photos/seed/pkg2/400/300', status: 'delivered', deliveredAt: daysAgo(1),
  })
  push(`${PRADO}/mail`, {
    registeredBy: U_GUARD, apartmentNumber: '101', residentId: U_RES,
    description: 'Documentos notaría', type: 'document', sender: 'Notaría 12',
    photoUrl: 'https://picsum.photos/seed/pkg3/400/300', status: 'confirmed', deliveredAt: daysAgo(8),
  })

  // Domicilios — códigos activos 4821 y 7350
  push(`${PRADO}/deliveries`, {
    residentId: U_RES, unitId: 'torre-a_101', apartmentNumber: '101', tower: 'Torre A',
    vendor: 'Pizza', description: "Pizza grande pepperoni — Domino's", code: '4821', status: 'expected',
  })
  push(`${PRADO}/deliveries`, {
    residentId: U_RES, unitId: 'torre-a_101', apartmentNumber: '101', tower: 'Torre A',
    vendor: 'Mercado', description: 'Mercado Rappi — 2 bolsas', code: '7350', status: 'expected',
  })
  push(`${PRADO}/deliveries`, {
    residentId: U_RES, unitId: 'torre-a_101', apartmentNumber: '101', tower: 'Torre A',
    vendor: 'Farmacia', description: 'Droguería Cruz Verde', code: '1199', status: 'delivered',
    deliveredAt: daysAgo(1), deliveredBy: U_GUARD,
  })

  // Cámaras
  push(`${PRADO}/cameras`, {
    name: 'CAM 01 — Lobby', location: 'Entrada principal', active: true,
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  })
  push(`${PRADO}/cameras`, {
    name: 'CAM 02 — Parqueadero', location: 'Sótano 1', active: true,
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  })
  push(`${PRADO}/cameras`, {
    name: 'CAM 03 — Piscina', location: 'Zona húmeda', active: true,
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  })
  push(`${PRADO}/cameras`, { name: 'CAM 04 — Ascensor Torre A', location: 'Torre A', streamUrl: '', active: false })

  // Mantenimientos
  push(`${PRADO}/maintenances`, {
    asset: 'elevator', assetLabel: 'Ascensor', title: 'Mantenimiento preventivo mensual',
    provider: 'Ascensores Schindler', scheduledDate: daysFromNow(3), recurrence: 'monthly', status: 'scheduled',
  })
  push(`${PRADO}/maintenances`, {
    asset: 'pool', assetLabel: 'Piscina', title: 'Tratamiento químico del agua',
    provider: 'AquaClean', scheduledDate: daysFromNow(1), recurrence: 'weekly', status: 'in_progress',
  })
  push(`${PRADO}/maintenances`, {
    asset: 'general', assetLabel: 'Zonas comunes', title: 'Fumigación general',
    provider: 'FumiHogar', scheduledDate: daysFromNow(10), recurrence: 'quarterly', status: 'scheduled',
  })
  push(`${PRADO}/maintenances`, {
    asset: 'elevator', assetLabel: 'Ascensor', title: 'Cambio de cables de tracción',
    provider: 'Ascensores Schindler', scheduledDate: daysAgo(15), recurrence: 'none', status: 'completed',
  })

  // PQRs
  push(`${PRADO}/pqrs`, {
    authorId: U_RES, apartmentNumber: '101', category: 'noise', title: 'Ruido excesivo en el 201',
    description: 'Desde hace una semana el apartamento 201 hace fiestas entre semana hasta las 2 a.m. Solicito que la administración tome medidas.',
    status: 'pending',
  })
  push(`${PRADO}/pqrs`, {
    authorId: U_RES, apartmentNumber: '101', category: 'services', title: 'Citófono dañado',
    description: 'El citófono del apto no timbra desde el viernes.',
    status: 'resolved', adminResponse: 'Se realizó el cambio del citófono el lunes. Quedamos atentos.',
  })

  // Reporte de daños (visibles para toda la unidad)
  push(`${PRADO}/damageReports`, {
    authorId: U_RES, apartmentNumber: '101', tower: 'Torre A', title: 'Luminaria dañada en pasillo piso 1',
    description: 'La lámpara del pasillo frente al apto 101 parpadea y se apaga por las noches.',
    status: 'in_review',
  })
  // Lo reportó el habitante; la dueña Gloria también lo ve
  push(`${PRADO}/damageReports`, {
    authorId: U_TENANT, apartmentNumber: '101', tower: 'Torre B', title: 'Humedad en el techo del baño',
    description: 'Mancha de humedad creciente en el baño principal, posible filtración del apto de arriba.',
    status: 'pending',
  })

  // Notificaciones
  push(`${PRADO}/notifications`, {
    recipientId: U_RES, title: '🛵 Domicilio entregado',
    body: 'Tu pedido de Droguería Cruz Verde fue autorizado en portería.',
    type: 'delivery', isRead: false, createdAt: hoursAgo(20),
  })
  push(`${PRADO}/notifications`, {
    recipientId: U_RES, title: '📦 Nueva correspondencia',
    body: 'Paquete de Amazon te espera en portería.',
    type: 'mail', isRead: false, createdAt: hoursAgo(5),
  })
  push(`${PRADO}/notifications`, {
    recipientId: U_RES, title: '✅ Reserva aprobada',
    body: 'Tu reserva del Salón Social fue aprobada por la administración.',
    type: 'reservation', isRead: true, createdAt: daysAgo(1),
  })
  push(`${PRADO}/notifications`, {
    recipientId: U_RES, title: '🔧 Mantenimiento programado',
    body: 'La piscina estará cerrada mañana por tratamiento del agua.',
    type: 'maintenance', isRead: true, createdAt: daysAgo(2),
  })

  // Invitaciones
  push('invites', {
    id: 'PRADO-DEMO', complexId: PRADO, complexName: 'Conjunto El Prado',
    towers: ['Torre A', 'Torre B'], role: 'resident', residentType: 'owner_resident',
    maxUses: 0, usedCount: 3, active: true, createdBy: U_ADMIN,
  })
  push('invites', {
    id: 'PRADO-HABITA', complexId: PRADO, complexName: 'Conjunto El Prado',
    towers: ['Torre A', 'Torre B'], role: 'resident', residentType: 'tenant',
    maxUses: 0, usedCount: 1, active: true, createdBy: U_ADMIN,
  })
  push('invites', {
    id: 'PRADO-GUARD', complexId: PRADO, complexName: 'Conjunto El Prado',
    towers: ['Torre A', 'Torre B'], role: 'guard', maxUses: 5, usedCount: 1, active: true, createdBy: U_ADMIN,
  })

  // ─── Edificio Mirador ───────────────────────────────────────────────────────
  push('complexes', {
    id: MIRADOR, name: 'Edificio Mirador', address: 'Carrera 7 # 85-21', city: 'Bogotá',
    phone: '601 765 4321', createdBy: U_ADMIN, towers: ['Única'],
    amenities: [
      { id: 'terrace', name: 'Terraza BBQ', icon: 'weather-sunny', requiresApproval: true, blockIfDelinquent: true, active: true },
      { id: 'coworking', name: 'Coworking', icon: 'laptop', requiresApproval: false, blockIfDelinquent: true, active: true },
    ],
  })
  for (let floor = 1; floor <= 3; floor++) {
    for (let u = 1; u <= 2; u++) {
      const number = `${floor}${String(u).padStart(2, '0')}`
      push(`${MIRADOR}/units`, {
        id: `unica_${number}`, tower: 'Única', number, label: number,
        ownerIds: [], ownerNames: [],
        feeStatus: floor === 2 && u === 1 ? 'delinquent' : 'current',
      })
    }
  }
  push(`${MIRADOR}/news`, {
    authorId: U_ADMIN, title: 'Bienvenidos a la app del Mirador',
    body: 'A partir de hoy toda la comunicación del edificio se gestiona por PortalResidencial.',
    hasAttachment: false, publishedAt: daysAgo(1),
  })
  push(`${MIRADOR}/cameras`, {
    name: 'CAM 01 — Recepción', location: 'Lobby', active: true,
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
  })
  push('invites', {
    id: 'MIRA-DEMO', complexId: MIRADOR, complexName: 'Edificio Mirador',
    towers: ['Única'], role: 'resident', maxUses: 0, usedCount: 0, active: true, createdBy: U_ADMIN,
  })

  return db
}
