import dayjs from 'dayjs'
import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { EmptyState, ListRow, Screen, StatusChip } from '../../components/ui'
import * as db from '../../data/db'
import { useCollection } from '../../hooks/useCollection'
import { useComplexId } from '../../stores/auth'
import { colors, weight } from '../../theme'
import type { Reservation } from '../../types'

export default function AdminReservations() {
  const complexId = useComplexId()
  const items = useCollection<Reservation>('reservations', undefined, (a, b) => b.createdAt - a.createdAt)

  function setStatus(r: Reservation, status: 'approved' | 'rejected') {
    if (!complexId) return
    db.update(db.col(complexId, 'reservations'), r.id, { status })
  }

  return (
    <Screen title="Gestión de Reservas" showBack={false}>
      {items.length === 0 ? (
        <EmptyState icon="calendar-check-outline" message="No hay reservas" />
      ) : (
        <View style={{ gap: 10 }}>
          {items.map((r) => (
            <View key={r.id}>
              <ListRow
                icon="calendar-check-outline"
                iconBg={colors.successSoft}
                iconColor={colors.success}
                title={`${r.title} · Apto ${r.apartmentNumber}`}
                subtitle={`${r.amenityName} · ${dayjs(r.startDateTime).format('ddd D MMM, h:mm a')}`}
                meta={r.responsibleName}
                right={<StatusChip status={r.status} />}
              />
              {r.status === 'pending' && (
                <View style={s.actions}>
                  <Pressable style={[s.actionBtn, { backgroundColor: colors.successSoft }]} onPress={() => setStatus(r, 'approved')}>
                    <Text style={[s.actionText, { color: '#15803D' }]}>Aprobar</Text>
                  </Pressable>
                  <Pressable style={[s.actionBtn, { backgroundColor: colors.errorSoft }]} onPress={() => setStatus(r, 'rejected')}>
                    <Text style={[s.actionText, { color: '#B91C1C' }]}>Rechazar</Text>
                  </Pressable>
                </View>
              )}
            </View>
          ))}
        </View>
      )}
    </Screen>
  )
}

const s = StyleSheet.create({
  actions: { flexDirection: 'row', gap: 8, marginTop: 6, marginHorizontal: 8 },
  actionBtn: { flex: 1, borderRadius: 10, paddingVertical: 9, alignItems: 'center' },
  actionText: { fontSize: 14, ...weight.bold },
})
