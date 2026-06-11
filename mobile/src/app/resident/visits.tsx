import dayjs from 'dayjs'
import React, { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { EmptyState, ListRow, Screen } from '../../components/ui'
import { useCollection } from '../../hooks/useCollection'
import { useMembership } from '../../stores/auth'
import { colors, weight } from '../../theme'
import type { Visit } from '../../types'

export default function Visits() {
  const membership = useMembership()
  const [tab, setTab] = useState<'pedestrian' | 'vehicle'>('pedestrian')
  const items = useCollection<Visit>(
    'visits',
    (v) => v.apartmentNumber === membership?.apartmentNumber && v.type === tab,
    (a, b) => b.entryTime - a.entryTime,
  )

  return (
    <Screen title="Mis Visitas">
      <View style={s.tabs}>
        {([['pedestrian', 'Peatonales', 'walk'], ['vehicle', 'Vehículos', 'car-outline']] as const).map(([key, label]) => (
          <Pressable
            key={key}
            style={[s.tab, tab === key && s.tabOn]}
            onPress={() => setTab(key)}
          >
            <Text style={[s.tabText, tab === key && s.tabTextOn]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      {items.length === 0 ? (
        <EmptyState icon={tab === 'pedestrian' ? 'walk' : 'car-outline'} message="Sin visitas registradas" />
      ) : (
        <View style={{ gap: 10 }}>
          {items.map((v) => (
            <ListRow
              key={v.id}
              icon={v.type === 'pedestrian' ? 'walk' : 'car-outline'}
              iconBg={colors.infoSoft}
              iconColor={colors.info}
              title={v.visitorName ?? v.driverName ?? 'Visitante'}
              subtitle={`Entrada: ${dayjs(v.entryTime).format('D MMM · h:mm a')}${v.vehiclePlate ? ` · ${v.vehiclePlate}` : ''}`}
              meta={v.exitTime ? `Salida: ${dayjs(v.exitTime).format('h:mm a')} (${v.duration} min)` : 'Dentro del edificio'}
            />
          ))}
        </View>
      )}
    </Screen>
  )
}

const s = StyleSheet.create({
  tabs: {
    flexDirection: 'row', gap: 8, marginBottom: 16,
    backgroundColor: colors.surface2, borderRadius: 9999, padding: 4,
  },
  tab: { flex: 1, paddingVertical: 9, borderRadius: 9999, alignItems: 'center' },
  tabOn: { backgroundColor: colors.surface },
  tabText: { fontSize: 14, ...weight.semibold, color: colors.textSecondary },
  tabTextOn: { color: colors.primary },
})
