import dayjs from 'dayjs'
import React, { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { BottomSheet, Btn, EmptyState, Input, ListRow, Screen } from '../../components/ui'
import * as db from '../../data/db'
import { useCollection } from '../../hooks/useCollection'
import { useAuth, useComplexId } from '../../stores/auth'
import { confirmAsk } from '../../stores/confirm'
import { colors } from '../../theme'
import type { Post } from '../../types'

export default function AdminPublish() {
  const user = useAuth((s) => s.user)
  const complexId = useComplexId()
  const [tab, setTab] = useState<'news' | 'circulars'>('news')
  const items = useCollection<Post>(tab, undefined, (a, b) => b.publishedAt - a.publishedAt)

  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')

  function publish() {
    if (!complexId || !user) return
    db.add(db.col(complexId, tab), {
      authorId: user.id,
      title: title.trim(),
      body: body.trim(),
      hasAttachment: false,
      publishedAt: Date.now(),
    })
    setOpen(false)
    setTitle(''); setBody('')
  }

  async function remove(p: Post) {
    const ok = await confirmAsk({
      title: tab === 'news' ? '¿Eliminar noticia?' : '¿Eliminar circular?',
      message: `"${p.title}" dejará de ser visible para los residentes.`,
    })
    if (ok && complexId) db.remove(db.col(complexId, tab), p.id)
  }

  return (
    <Screen title="Publicar" showBack={false}>
      <View style={s.tabs}>
        {([['news', 'Noticias'], ['circulars', 'Circulares']] as const).map(([key, label]) => (
          <Pressable key={key} style={[s.tab, tab === key && s.tabOn]} onPress={() => setTab(key)}>
            <Text style={[s.tabText, tab === key && s.tabTextOn]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      <Btn icon="plus" onPress={() => setOpen(true)} style={{ marginBottom: 16 }}>
        {tab === 'news' ? 'Publicar noticia' : 'Publicar circular'}
      </Btn>

      {items.length === 0 ? (
        <EmptyState icon="newspaper-variant-outline" message="Nada publicado aún" />
      ) : (
        <View style={{ gap: 10 }}>
          {items.map((p) => (
            <ListRow
              key={p.id}
              icon={tab === 'news' ? 'newspaper-variant-outline' : 'file-document-outline'}
              title={p.title}
              subtitle={p.body.slice(0, 80)}
              meta={dayjs(p.publishedAt).format('D MMM YYYY')}
              right={
                <Pressable onPress={() => remove(p)} hitSlop={8}>
                  <Text style={{ color: colors.error, fontSize: 12, fontWeight: '600' }}>Eliminar</Text>
                </Pressable>
              }
            />
          ))}
        </View>
      )}

      <BottomSheet visible={open} onClose={() => setOpen(false)} title={tab === 'news' ? 'Nueva noticia' : 'Nueva circular'}>
        <View style={{ gap: 12 }}>
          <Input label="Título" value={title} onChangeText={setTitle} />
          <Input
            label="Contenido"
            multiline
            numberOfLines={6}
            style={{ minHeight: 140, textAlignVertical: 'top', paddingTop: 12 }}
            value={body}
            onChangeText={setBody}
          />
          <Btn disabled={!title.trim() || !body.trim()} onPress={publish}>Publicar</Btn>
        </View>
      </BottomSheet>
    </Screen>
  )
}

const s = StyleSheet.create({
  tabs: {
    flexDirection: 'row', gap: 8, marginBottom: 14,
    backgroundColor: colors.surface2, borderRadius: 9999, padding: 4,
  },
  tab: { flex: 1, paddingVertical: 9, borderRadius: 9999, alignItems: 'center' },
  tabOn: { backgroundColor: colors.surface },
  tabText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  tabTextOn: { color: colors.admin },
})
