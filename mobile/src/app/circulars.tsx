import dayjs from 'dayjs'
import { useRouter } from 'expo-router'
import React from 'react'
import { View } from 'react-native'
import { EmptyState, ListRow, Screen } from '../components/ui'
import { useCollection } from '../hooks/useCollection'
import type { Post } from '../types'

export default function Circulars() {
  const router = useRouter()
  const items = useCollection<Post>('circulars', undefined, (a, b) => b.publishedAt - a.publishedAt)

  return (
    <Screen title="Circulares">
      {items.length === 0 ? (
        <EmptyState icon="file-document-outline" message="No hay circulares publicadas" />
      ) : (
        <View style={{ gap: 10 }}>
          {items.map((c) => (
            <ListRow
              key={c.id}
              icon="file-document-outline"
              iconBg="#E0E7FF"
              iconColor="#4338CA"
              title={c.title}
              subtitle={c.body.slice(0, 90)}
              meta={dayjs(c.publishedAt).format('D MMM YYYY')}
              onPress={() => router.push(`/content/circulars/${c.id}` as never)}
            />
          ))}
        </View>
      )}
    </Screen>
  )
}
