import dayjs from 'dayjs'
import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { EmptyState, Icon, Screen } from '../../components/ui'
import * as db from '../../data/db'
import { useCollection } from '../../hooks/useCollection'
import { useAuth, useComplexId } from '../../stores/auth'
import { colors, shadow } from '../../theme'
import type { AppNotification } from '../../types'

const TYPE_ICON: Record<string, string> = {
  visit: 'walk', mail: 'package-variant-closed', reservation: 'calendar-check-outline',
  news: 'newspaper-variant-outline', pqr: 'message-alert-outline', damage: 'wrench-outline',
  circular: 'file-document-outline', delivery: 'moped-outline', maintenance: 'wrench-clock', billing: 'cash',
}

export default function Notifications() {
  const user = useAuth((s) => s.user)
  const complexId = useComplexId()
  const items = useCollection<AppNotification>(
    'notifications',
    (n) => n.recipientId === user?.id,
    (a, b) => b.createdAt - a.createdAt,
  )

  function markRead(n: AppNotification) {
    if (!complexId || n.isRead) return
    db.update(db.col(complexId, 'notifications'), n.id, { isRead: true })
  }

  return (
    <Screen title="Avisos" showBack={false}>
      {items.length === 0 ? (
        <EmptyState icon="bell-outline" message="No tienes notificaciones" />
      ) : (
        <View style={{ gap: 8 }}>
          {items.map((n) => (
            <Pressable
              key={n.id}
              style={({ pressed }) => [s.item, !n.isRead && s.itemUnread, pressed && { transform: [{ scale: 0.98 }] }]}
              onPress={() => markRead(n)}
            >
              <View style={s.icon}>
                <Icon name={TYPE_ICON[n.type] ?? 'bell-outline'} size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.title}>{n.title}</Text>
                <Text style={s.body} numberOfLines={2}>{n.body}</Text>
                <Text style={s.time}>{dayjs(n.createdAt).format('D MMM · h:mm a')}</Text>
              </View>
              {!n.isRead && <View style={s.dot} />}
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  )
}

const s = StyleSheet.create({
  item: {
    flexDirection: 'row', gap: 12, alignItems: 'flex-start',
    backgroundColor: colors.surface, borderRadius: 16, padding: 14, ...shadow.xs,
  },
  itemUnread: { borderWidth: 1.5, borderColor: colors.primarySoft },
  icon: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 14.5, fontWeight: '700', color: colors.text },
  body: { fontSize: 13.5, color: colors.textSecondary, marginTop: 1, lineHeight: 17 },
  time: { fontSize: 12, color: colors.textTertiary, marginTop: 3 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 6 },
})
