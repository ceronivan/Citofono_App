<script setup lang="ts">
/**
 * Vista de seed para desarrollo — solo visible en modo dev
 * Ruta: /dev/seed
 * Requiere estar autenticado como admin
 */
import { ref } from 'vue'
import {
  collection, addDoc, setDoc, getDoc, getDocs, doc, serverTimestamp, Timestamp, writeBatch,
} from 'firebase/firestore'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth.store'

const authStore = useAuthStore()
const running = ref(false)
const done = ref(false)
const log = ref<string[]>([])
const complexId = ref(authStore.complexId ?? '')

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return Timestamp.fromDate(d)
}
function daysFromNow(n: number) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return Timestamp.fromDate(d)
}

function push(msg: string) { log.value.push(msg) }

async function runSeed() {
  if (!complexId.value) { push('❌ Ingresa un complexId'); return }
  running.value = true
  log.value = []
  done.value = false

  try {
    const cid = complexId.value.trim()

    // ── Noticias ─────────────────────────────────────────────────────────────
    push('📰 Creando noticias...')
    const newsCol = collection(db, 'complexes', cid, 'news')
    const news = [
      {
        title: 'Asamblea General de Propietarios 2025',
        body: 'Estimados propietarios y residentes,\n\nLes comunicamos que la Asamblea General Ordinaria se realizará el sábado 24 de mayo a las 10:00 a.m. en el salón social.\n\nORDEN DEL DÍA:\n1. Verificación del quórum\n2. Informe de gestión\n3. Aprobación presupuesto 2025\n4. Elección del Consejo de Administración\n\nSe ruega puntual asistencia.',
        hasAttachment: false, authorId: 'seed', publishedAt: daysAgo(2),
      },
      {
        title: 'Corte de agua — Miércoles 21 de mayo',
        body: 'Informamos que el miércoles 21 de mayo habrá corte de agua desde las 8:00 a.m. hasta las 3:00 p.m. por mantenimiento preventivo a la red de tuberías.\n\nRecomendamos almacenar suficiente agua.\n\nAdministración.',
        hasAttachment: false, authorId: 'seed', publishedAt: daysAgo(5),
      },
      {
        title: 'Nuevas normas de convivencia',
        body: 'Se han actualizado las normas de convivencia del conjunto. Los cambios principales:\n\n• Horario de mudanzas: lunes a viernes 8:00 a.m. - 5:00 p.m.\n• Mascotas: uso obligatorio de correa\n• Ruido: silencio después de las 11:00 p.m.\n• Parqueaderos: prohibido ocupar espacios ajenos\n\nVigencia: 1 de junio de 2025.',
        hasAttachment: true, attachmentType: 'pdf',
        attachmentUrl: 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/PDF1.pdf',
        authorId: 'seed', publishedAt: daysAgo(8),
      },
      {
        title: 'Celebración Día de la Madre',
        body: '¡Los invitamos a celebrar el Día de la Madre!\n\nFecha: Sábado 10 de mayo\nHora: 4:00 p.m.\nLugar: Áreas comunes\n\n🎂 Torta y refrigerio\n🎁 Rifa de premios\n🎵 Música en vivo\n\n¡No falten!',
        hasAttachment: false, authorId: 'seed', publishedAt: daysAgo(15),
      },
      {
        title: 'Resultados encuesta de satisfacción Q1',
        body: 'Compartimos los resultados de la encuesta del primer trimestre. Participaron 47 hogares.\n\n⭐ Puntuación general: 4.2 / 5.0\n\nMás valorado:\n✅ Seguridad (4.7)\n✅ Limpieza áreas comunes (4.5)\n\nA mejorar:\n⚠️ Tiempo respuesta PQRs\n⚠️ Mantenimiento ascensor\n\nGracias por sus aportes.',
        hasAttachment: false, authorId: 'seed', publishedAt: daysAgo(20),
      },
    ]
    for (const item of news) {
      await addDoc(newsCol, { ...item, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
      push(`   ✓ ${item.title}`)
    }

    // ── Circulares ────────────────────────────────────────────────────────────
    push('📄 Creando circulares...')
    const circularsCol = collection(db, 'complexes', cid, 'circulars')
    const circulars = [
      {
        title: 'Circular 01-2025 — Parqueaderos',
        body: 'La administración recuerda las normas de parqueaderos:\n\n1. Cada apto tiene asignado su parqueadero.\n2. Prohibido parquear en espacios ajenos.\n3. Visitantes solo en zonas amarillas.\n4. No lavar vehículos dentro del conjunto.',
        hasAttachment: false, authorId: 'seed', publishedAt: daysAgo(3),
      },
      {
        title: 'Circular 02-2025 — Política de mascotas',
        body: 'En cumplimiento del Código de Policía:\n\n• Mascotas siempre con correa en áreas comunes.\n• Obligatorio recoger excrementos.\n• No acceso a piscina, salón social ni cancha.\n• Razas peligrosas deben usar bozal.\n\nAgradecemos su colaboración.',
        hasAttachment: false, authorId: 'seed', publishedAt: daysAgo(10),
      },
      {
        title: 'Circular 03-2025 — Reserva de zonas comunes',
        body: 'Nuevo procedimiento para reservas en la app:\n\n1. Vaya a "Mis Reservas"\n2. Seleccione la zona\n3. Elija fecha y hora\n4. Envíe la solicitud\n\nTARIFAS:\n• Salón social: $50.000\n• Cancha: Gratis (máx. 2h)\n• BBQ: $30.000\n\nFianza reembolsable: $100.000',
        hasAttachment: true, attachmentType: 'image',
        attachmentUrl: 'https://picsum.photos/seed/circular/800/400',
        authorId: 'seed', publishedAt: daysAgo(18),
      },
    ]
    for (const item of circulars) {
      await addDoc(circularsCol, { ...item, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
      push(`   ✓ ${item.title}`)
    }

    // ── Correspondencia ───────────────────────────────────────────────────────
    push('📦 Creando correspondencia (apto 101)...')
    const mailCol = collection(db, 'complexes', cid, 'mail')
    const mailItems = [
      {
        description: 'Paquete de Amazon — Electrónica',
        type: 'package', sender: 'Amazon Colombia',
        apartmentNumber: '101', status: 'pending',
        photoUrl: 'https://picsum.photos/seed/pkg1/400/300',
        registeredBy: 'guard-seed', residentId: authStore.userData?.id ?? 'resident-seed',
      },
      {
        description: 'Carta certificada Bancolombia',
        type: 'letter', sender: 'Bancolombia',
        apartmentNumber: '101', status: 'delivered',
        photoUrl: 'https://picsum.photos/seed/pkg2/400/300',
        registeredBy: 'guard-seed', residentId: authStore.userData?.id ?? 'resident-seed',
        deliveredAt: daysAgo(1), residentConfirmedExpiry: daysFromNow(4),
      },
      {
        description: 'Documentos notaría El Nogal',
        type: 'document', sender: 'Notaría 12 de Bogotá',
        apartmentNumber: '101', status: 'confirmed',
        photoUrl: 'https://picsum.photos/seed/pkg3/400/300',
        registeredBy: 'guard-seed', residentId: authStore.userData?.id ?? 'resident-seed',
        deliveredAt: daysAgo(10), residentConfirmedAt: daysAgo(8),
      },
      {
        description: 'Paquete DHL — Ropa deportiva',
        type: 'package', sender: 'DHL Express',
        apartmentNumber: '101', status: 'pending',
        photoUrl: 'https://picsum.photos/seed/pkg4/400/300',
        registeredBy: 'guard-seed', residentId: authStore.userData?.id ?? 'resident-seed',
      },
    ]
    for (const item of mailItems) {
      await addDoc(mailCol, { ...item, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
      push(`   ✓ ${item.description} [${item.status}]`)
    }

    push('─'.repeat(50))
    push(`🎉 Seed completado — complexId: ${cid}`)
    done.value = true

  } catch (err: any) {
    push(`❌ Error: ${err?.message ?? err}`)
  } finally {
    running.value = false
  }
}

// ─── Seed v2: multi-edificio, unidades, domicilios, cámaras, mantenimientos ──
async function runSeedV2() {
  if (!complexId.value) { push('❌ Ingresa un complexId'); return }
  running.value = true
  log.value = []
  done.value = false

  try {
    const cid = complexId.value.trim()
    const myApt = authStore.apartmentNumber || '101'
    const myId = authStore.userData?.id ?? 'resident-seed'
    const myName = authStore.fullName || 'Residente Demo'

    // ── Complex doc: torres + amenidades ─────────────────────────────────────
    push('🏢 Configurando edificio (torres + amenidades)...')
    const complexRef = doc(db, 'complexes', cid)
    const snap = await getDoc(complexRef)
    const existing = snap.exists() ? snap.data() : {}
    await setDoc(complexRef, {
      name: existing.name ?? 'Conjunto El Prado',
      address: existing.address ?? 'Calle 123 # 45-67',
      city: existing.city ?? 'Bogotá',
      towers: existing.towers?.length ? existing.towers : ['Torre A', 'Torre B'],
      amenities: existing.amenities?.length ? existing.amenities : [
        { id: 'social_room', name: 'Salón Social', icon: 'mdi-party-popper', requiresApproval: true, blockIfDelinquent: true, active: true },
        { id: 'pool', name: 'Piscina', icon: 'mdi-pool', requiresApproval: true, blockIfDelinquent: true, active: true },
        { id: 'bbq', name: 'Zona BBQ', icon: 'mdi-grill-outline', requiresApproval: true, blockIfDelinquent: true, active: true },
        { id: 'gym', name: 'Gimnasio', icon: 'mdi-dumbbell', requiresApproval: false, blockIfDelinquent: true, active: true },
        { id: 'court', name: 'Cancha', icon: 'mdi-basketball', requiresApproval: true, blockIfDelinquent: false, active: true },
      ],
      createdBy: existing.createdBy ?? myId,
      createdAt: existing.createdAt ?? serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true })
    push('   ✓ Edificio configurado')

    // ── Unidades ──────────────────────────────────────────────────────────────
    const unitsSnap = await getDocs(collection(db, 'complexes', cid, 'units'))
    if (unitsSnap.empty) {
      push('🚪 Creando unidades (2 torres × 5 pisos × 2 aptos)...')
      const batch = writeBatch(db)
      for (const tower of ['Torre A', 'Torre B']) {
        for (let floor = 1; floor <= 5; floor++) {
          for (let u = 1; u <= 2; u++) {
            const number = `${floor}${String(u).padStart(2, '0')}`
            const id = `${tower.replace(/\s+/g, '-')}_${number}`.toLowerCase()
            const isMine = tower === 'Torre A' && number === myApt
            const delinquent = ['201', '302'].includes(number) && tower === 'Torre A'
            batch.set(doc(db, 'complexes', cid, 'units', id), {
              tower, number, label: `${tower} · ${number}`,
              ownerIds: isMine ? [myId] : [],
              ownerNames: isMine ? [myName] : [],
              feeStatus: delinquent ? 'delinquent' : 'current',
              ...(delinquent ? { feePeriod: '2026-06', feeNotes: 'Mora de 2 meses' } : {}),
              createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
            })
          }
        }
      }
      await batch.commit()
      push('   ✓ 20 unidades creadas (201 y 302 en mora)')
    } else {
      push(`🚪 Ya existen ${unitsSnap.size} unidades — omitido`)
    }

    // ── Invitaciones ─────────────────────────────────────────────────────────
    push('🎟️ Creando códigos de invitación...')
    const invites = [
      { code: 'PRADO-DEMO', role: 'resident' },
      { code: 'PRADO-GUARD', role: 'guard' },
    ]
    for (const inv of invites) {
      await setDoc(doc(db, 'invites', inv.code), {
        complexId: cid,
        complexName: existing.name ?? 'Conjunto El Prado',
        towers: ['Torre A', 'Torre B'],
        role: inv.role, maxUses: 0, usedCount: 0, active: true,
        createdBy: myId, createdAt: serverTimestamp(),
      })
      push(`   ✓ ${inv.code} (${inv.role})`)
    }

    // ── Domicilios ───────────────────────────────────────────────────────────
    push('🛵 Creando domicilios...')
    const dlvCol = collection(db, 'complexes', cid, 'deliveries')
    const deliveries = [
      { vendor: 'Pizza', description: 'Pizza grande pepperoni — Domino\'s', code: '4821', status: 'expected', apartmentNumber: myApt },
      { vendor: 'Mercado', description: 'Mercado Rappi', code: '7350', status: 'expected', apartmentNumber: myApt },
      { vendor: 'Farmacia', description: 'Droguería Cruz Verde', code: '1199', status: 'delivered', apartmentNumber: myApt, deliveredAt: daysAgo(1), deliveredBy: 'guard-seed' },
    ]
    for (const d of deliveries) {
      await addDoc(dlvCol, { ...d, tower: 'Torre A', residentId: myId, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
      push(`   ✓ ${d.vendor} · código ${d.code} [${d.status}]`)
    }

    // ── Cámaras ──────────────────────────────────────────────────────────────
    push('📹 Creando cámaras (mock)...')
    const camCol = collection(db, 'complexes', cid, 'cameras')
    const cams = [
      { name: 'CAM 01 — Lobby', location: 'Entrada principal', streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', active: true },
      { name: 'CAM 02 — Parqueadero', location: 'Sótano 1', streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', active: true },
      { name: 'CAM 03 — Piscina', location: 'Zona húmeda', streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', active: true },
      { name: 'CAM 04 — Ascensor', location: 'Torre A', streamUrl: '', active: false },
    ]
    for (const c of cams) {
      await addDoc(camCol, { ...c, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
      push(`   ✓ ${c.name}`)
    }

    // ── Mantenimientos ───────────────────────────────────────────────────────
    push('🔧 Creando mantenimientos...')
    const mntCol = collection(db, 'complexes', cid, 'maintenances')
    const mnts = [
      { asset: 'elevator', assetLabel: 'Ascensor', title: 'Mantenimiento preventivo mensual', provider: 'Ascensores Schindler', scheduledDate: daysFromNow(3), recurrence: 'monthly', status: 'scheduled' },
      { asset: 'pool', assetLabel: 'Piscina', title: 'Tratamiento químico del agua', provider: 'AquaClean', scheduledDate: daysFromNow(1), recurrence: 'weekly', status: 'scheduled' },
      { asset: 'general', assetLabel: 'Zonas comunes', title: 'Fumigación general', provider: 'FumiHogar', scheduledDate: daysFromNow(10), recurrence: 'quarterly', status: 'scheduled' },
      { asset: 'elevator', assetLabel: 'Ascensor', title: 'Cambio de cables de tracción', provider: 'Ascensores Schindler', scheduledDate: daysAgo(15), recurrence: 'none', status: 'completed' },
    ]
    for (const m of mnts) {
      await addDoc(mntCol, { ...m, description: '', createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
      push(`   ✓ ${m.assetLabel}: ${m.title}`)
    }

    // ── Visitas (para el registro de ingresos) ───────────────────────────────
    push('🚶 Creando visitas...')
    const visitsCol = collection(db, 'complexes', cid, 'visits')
    const visits = [
      { type: 'pedestrian', visitorName: 'Carlos Gómez', apartmentNumber: myApt, entryTime: daysAgo(0), exitTime: null },
      { type: 'pedestrian', visitorName: 'María Rodríguez', apartmentNumber: '202', entryTime: daysAgo(1), exitTime: daysAgo(1), duration: 95 },
      { type: 'vehicle', driverName: 'Pedro Sánchez', vehiclePlate: 'ABC123', apartmentNumber: myApt, entryTime: daysAgo(2), exitTime: daysAgo(2), duration: 180 },
      { type: 'pedestrian', visitorName: 'Ana Torres', apartmentNumber: '302', entryTime: daysAgo(3), exitTime: daysAgo(3), duration: 45 },
      { type: 'vehicle', driverName: 'Luisa Díaz', vehiclePlate: 'XYZ789', apartmentNumber: '202', entryTime: daysAgo(4), exitTime: daysAgo(4), duration: 60 },
    ]
    for (const v of visits) {
      await addDoc(visitsCol, { ...v, guardId: 'guard-seed', residentId: myId, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
      push(`   ✓ ${(v as any).visitorName ?? (v as any).driverName} → ${v.apartmentNumber}`)
    }

    push('─'.repeat(50))
    push(`🎉 Seed v2 completado — complexId: ${cid}`)
    push('Códigos de invitación: PRADO-DEMO (residente) · PRADO-GUARD (portería)')
    push('Códigos de domicilio activos: 4821 (Pizza) · 7350 (Mercado)')
    done.value = true
  } catch (err: any) {
    push(`❌ Error: ${err?.message ?? err}`)
  } finally {
    running.value = false
  }
}
</script>

<template>
  <div>
    <VAppBar flat color="background" border="b">
      <VAppBarTitle class="font-weight-bold text-warning">🌱 Dev Seed</VAppBarTitle>
    </VAppBar>

    <VContainer class="py-6" style="max-width: 540px;">
      <VAlert type="warning" variant="tonal" class="mb-5">
        Esta página solo existe en desarrollo. Inserta datos de prueba en Firestore.
      </VAlert>

      <VTextField
        v-model="complexId"
        label="complexId"
        variant="outlined"
        density="comfortable"
        placeholder="Pega el ID de tu complex en Firestore"
        class="mb-4"
        :hint="authStore.complexId ? `Tu usuario tiene: ${authStore.complexId}` : 'No detectado desde tu sesión'"
        persistent-hint
      />

      <VBtn
        color="warning"
        variant="flat"
        rounded="lg"
        class="w-100 text-none mb-3"
        prepend-icon="mdi-database-plus"
        :loading="running"
        :disabled="!complexId || running"
        @click="runSeed"
      >
        Seed v1 — noticias, circulares, correo
      </VBtn>

      <VBtn
        color="primary"
        variant="flat"
        rounded="lg"
        class="w-100 text-none mb-5"
        prepend-icon="mdi-office-building-plus"
        :loading="running"
        :disabled="!complexId || running"
        @click="runSeedV2"
      >
        Seed v2 — unidades, domicilios, cámaras, mantenimientos
      </VBtn>

      <VCard v-if="log.length" rounded="lg" border elevation="0">
        <VCardText>
          <pre style="font-size: 13px; line-height: 1.6; white-space: pre-wrap;">{{ log.join('\n') }}</pre>
        </VCardText>
      </VCard>

      <template v-if="done">
        <VDivider class="my-4" />
        <p class="text-subtitle-2 font-weight-bold mb-3">Ver resultados:</p>
        <div class="d-flex flex-column gap-2">
          <VBtn variant="tonal" color="primary" to="/news" prepend-icon="mdi-newspaper-variant-outline" class="text-none justify-start">
            /news — Noticias (residente)
          </VBtn>
          <VBtn variant="tonal" color="primary" to="/circulars" prepend-icon="mdi-file-document-outline" class="text-none justify-start">
            /circulars — Circulares (residente)
          </VBtn>
          <VBtn variant="tonal" color="primary" to="/mail" prepend-icon="mdi-package-variant" class="text-none justify-start">
            /mail — Correspondencia (residente)
          </VBtn>
          <VBtn variant="tonal" color="blue" to="/admin/news" prepend-icon="mdi-cog" class="text-none justify-start">
            /admin/news — Gestión noticias (admin)
          </VBtn>
          <VBtn variant="tonal" color="blue" to="/admin/circulars" prepend-icon="mdi-cog" class="text-none justify-start">
            /admin/circulars — Gestión circulares (admin)
          </VBtn>
        </div>
      </template>
    </VContainer>
  </div>
</template>
