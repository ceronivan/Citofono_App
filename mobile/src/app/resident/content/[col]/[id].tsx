import dayjs from 'dayjs'
import { useLocalSearchParams } from 'expo-router'
import React, { useMemo } from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import { EmptyState, Screen } from '../../../../components/ui'
import * as db from '../../../../data/db'
import { useComplexId } from '../../../../stores/auth'
import { colors } from '../../../../theme'
import type { Post } from '../../../../types'

/** Detalle compartido de noticias y circulares. */
export default function ContentDetail() {
  const { col, id } = useLocalSearchParams<{ col: string; id: string }>()
  const complexId = useComplexId()

  const item = useMemo(
    () => (complexId && col && id ? db.find<Post & { id: string }>(db.col(complexId, col), id) : undefined),
    [complexId, col, id],
  )

  const typeLabel = col === 'news' ? 'Noticia' : 'Circular'

  return (
    <Screen title={typeLabel}>
      {!item ? (
        <EmptyState icon="file-question-outline" message="Contenido no encontrado" />
      ) : (
        <View>
          <Text style={s.date}>{dayjs(item.publishedAt).format('D [de] MMMM [de] YYYY')}</Text>
          <Text style={s.title}>{item.title}</Text>
          <Text style={s.body}>{item.body}</Text>
          {item.hasAttachment && item.attachmentUrl ? (
            <Image source={{ uri: item.attachmentUrl }} style={s.attachment} resizeMode="cover" />
          ) : null}
        </View>
      )}
    </Screen>
  )
}

const s = StyleSheet.create({
  date: { fontSize: 13, color: colors.textTertiary, marginBottom: 6, textTransform: 'capitalize' },
  title: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5, color: colors.text, marginBottom: 14, lineHeight: 30 },
  body: { fontSize: 15, color: colors.text, lineHeight: 24 },
  attachment: {
    width: '100%', height: 200, borderRadius: 16, marginTop: 20,
    borderWidth: 2, borderColor: colors.primarySoft,
  },
})
