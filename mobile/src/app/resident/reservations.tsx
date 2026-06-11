import dayjs from 'dayjs'
import { useRouter } from 'expo-router'
import React from 'react'
import { View } from 'react-native'
import { Btn, EmptyState, ListRow, Screen, StatusChip } from '../../components/ui'
import { useCollection } from '../../hooks/useCollection'
import { useAuth } from '../../stores/auth'
import type { Reservation } from '../../types'

export default function Reservations() {
  const router = useRouter()
  const user = useAuth((s) => s.user)
  const items = useCollection<Reservation>(
    'reservations',
    (r) => r.residentId === user?.id,
    (a, b) => b.createdAt - a.createdAt,
  )

  return (
    <Screen title="Mis Reservas" showBack={false}>
      <Btn icon="plus" onPress={() => router.push('/resident/reservation-new' as never)} style={{ marginBottom: 16 }}>
        Crear nueva reserva
      </Btn>
      {items.length === 0 ? (
        <EmptyState icon="calendar-check-outline" message="Aún no has hecho reservas" />
      ) : (
        <View style={{ gap: 10 }}>
          {items.map((r, i) => (
            <ListRow
              key={r.id}
              index={i}
              icon="calendar-check-outline"
              title={r.title}
              subtitle={`${r.amenityName} · ${dayjs(r.startDateTime).format('ddd D MMM, h:mm a')}`}
              meta={r.adminNotes}
              right={<StatusChip status={r.status} />}
            />
          ))}
        </View>
      )}
    </Screen>
  )
}
