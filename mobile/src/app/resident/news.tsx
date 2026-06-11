import dayjs from 'dayjs'
import { useRouter } from 'expo-router'
import React from 'react'
import { View } from 'react-native'
import { EmptyState, ListRow, Screen } from '../../components/ui'
import { useCollection } from '../../hooks/useCollection'
import type { Post } from '../../types'

export default function News() {
  const router = useRouter()
  const items = useCollection<Post>('news', undefined, (a, b) => b.publishedAt - a.publishedAt)

  return (
    <Screen title="Noticias" showBack={false}>
      {items.length === 0 ? (
        <EmptyState icon="newspaper-variant-outline" message="No hay noticias publicadas" />
      ) : (
        <View style={{ gap: 10 }}>
          {items.map((n, i) => (
            <ListRow
              key={n.id}
              index={i}
              icon="newspaper-variant-outline"
              title={n.title}
              subtitle={n.body.replace(/\s+/g, ' ').slice(0, 90)}
              meta={dayjs(n.publishedAt).format('D MMM YYYY')}
              onPress={() => router.push(`/resident/content/news/${n.id}` as never)}
            />
          ))}
        </View>
      )}
    </Screen>
  )
}
