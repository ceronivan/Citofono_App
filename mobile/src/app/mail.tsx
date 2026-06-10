import dayjs from 'dayjs'
import React from 'react'
import { View } from 'react-native'
import { EmptyState, ListRow, Screen, StatusChip } from '../components/ui'
import { useCollection } from '../hooks/useCollection'
import { useAuth } from '../stores/auth'
import type { Mail } from '../types'

const TYPE_ICON: Record<string, string> = {
  package: 'package-variant-closed', letter: 'email-outline',
  document: 'file-document-outline', other: 'inbox-outline',
}
const TYPE_BG: Record<string, string> = {
  package: '#FEF3C7', letter: '#DBEAFE', document: '#E0E7FF', other: '#F3F4F6',
}
const TYPE_COLOR: Record<string, string> = {
  package: '#D97706', letter: '#2563EB', document: '#4338CA', other: '#6B7280',
}

export default function MailScreen() {
  const user = useAuth((s) => s.user)
  const items = useCollection<Mail>(
    'mail',
    (m) => m.residentId === user?.id,
    (a, b) => b.createdAt - a.createdAt,
  )

  return (
    <Screen title="Correspondencia">
      {items.length === 0 ? (
        <EmptyState icon="package-variant-closed" message="No tienes correspondencia" />
      ) : (
        <View style={{ gap: 10 }}>
          {items.map((m) => (
            <ListRow
              key={m.id}
              icon={TYPE_ICON[m.type]}
              iconBg={TYPE_BG[m.type]}
              iconColor={TYPE_COLOR[m.type]}
              title={m.description}
              subtitle={m.sender ? `De: ${m.sender}` : undefined}
              meta={dayjs(m.createdAt).format('D MMM YYYY')}
              right={<StatusChip status={m.status} label={m.status === 'pending' ? 'En portería' : undefined} />}
            />
          ))}
        </View>
      )}
    </Screen>
  )
}
