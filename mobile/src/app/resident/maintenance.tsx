import dayjs from 'dayjs'
import React from 'react'
import { Text, View } from 'react-native'
import { EmptyState, ListRow, Screen, SectionTitle, StatusChip } from '../../components/ui'
import { useCollection } from '../../hooks/useCollection'
import type { MaintenanceTask } from '../../types'

const ASSET_ICON: Record<string, string> = {
  elevator: 'elevator-passenger-outline', pool: 'pool', general: 'office-building-cog-outline',
}

export default function Maintenance() {
  const items = useCollection<MaintenanceTask>('maintenances', undefined, (a, b) => a.scheduledDate - b.scheduledDate)
  const upcoming = items.filter((m) => m.status === 'scheduled' || m.status === 'in_progress')
  const past = items.filter((m) => m.status === 'completed')

  return (
    <Screen title="Mantenimientos">
      <Text style={{ fontSize: 14.5, color: '#71717A', lineHeight: 19, marginBottom: 6 }}>
        Calendario de mantenimientos del edificio: ascensores, piscina y zonas comunes.
      </Text>
      {items.length === 0 ? (
        <EmptyState icon="wrench-clock" message="No hay mantenimientos programados" />
      ) : (
        <>
          {upcoming.length > 0 && <SectionTitle>Próximos</SectionTitle>}
          <View style={{ gap: 8 }}>
            {upcoming.map((m) => (
              <ListRow
                key={m.id}
                icon={ASSET_ICON[m.asset] ?? 'wrench-outline'}
                iconBg="#DBEAFE"
                iconColor="#2563EB"
                title={m.title}
                subtitle={`${m.assetLabel}${m.provider ? ` · ${m.provider}` : ''}`}
                meta={dayjs(m.scheduledDate).format('dddd D [de] MMMM')}
                right={<StatusChip status={m.status} />}
              />
            ))}
          </View>
          {past.length > 0 && <SectionTitle>Historial</SectionTitle>}
          <View style={{ gap: 8, opacity: 0.7 }}>
            {past.map((m) => (
              <ListRow
                key={m.id}
                icon="check"
                iconBg="#DCFCE7"
                iconColor="#16A34A"
                title={m.title}
                subtitle={m.assetLabel}
                meta={dayjs(m.scheduledDate).format('D MMM YYYY')}
              />
            ))}
          </View>
        </>
      )}
    </Screen>
  )
}
