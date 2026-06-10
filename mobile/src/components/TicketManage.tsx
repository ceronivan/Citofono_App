import React, { useState } from 'react'
import { View } from 'react-native'
import * as db from '../data/db'
import { useCollection } from '../hooks/useCollection'
import { useComplexId } from '../stores/auth'
import { colors } from '../theme'
import { BottomSheet, Btn, EmptyState, Input, ListRow, Screen, StatusChip } from './ui'

interface Ticket {
  id: string
  apartmentNumber: string
  title: string
  description: string
  status: string
  adminResponse?: string
  createdAt: number
}

/** Gestión admin de PQRs / Reportes de daños: responder y resolver. */
export function TicketManage({
  collection,
  title,
  icon,
  emptyMessage,
  showBack = false,
}: {
  collection: 'pqrs' | 'damageReports'
  title: string
  icon: string
  emptyMessage: string
  showBack?: boolean
}) {
  const complexId = useComplexId()
  const items = useCollection<Ticket>(collection, undefined, (a, b) => b.createdAt - a.createdAt)
  const [selected, setSelected] = useState<Ticket | null>(null)
  const [response, setResponse] = useState('')

  function resolve() {
    if (!complexId || !selected) return
    db.update(db.col(complexId, collection), selected.id, {
      status: 'resolved',
      adminResponse: response.trim(),
    })
    setSelected(null)
    setResponse('')
  }

  return (
    <Screen title={title} showBack={showBack}>
      {items.length === 0 ? (
        <EmptyState icon={icon} message={emptyMessage} />
      ) : (
        <View style={{ gap: 10 }}>
          {items.map((t) => (
            <ListRow
              key={t.id}
              icon={icon}
              iconBg={colors.errorSoft}
              iconColor={colors.error}
              title={`${t.title} · Apto ${t.apartmentNumber}`}
              subtitle={t.description}
              right={<StatusChip status={t.status} />}
              onPress={t.status !== 'resolved' ? () => { setSelected(t); setResponse('') } : undefined}
            />
          ))}
        </View>
      )}

      <BottomSheet visible={!!selected} onClose={() => setSelected(null)} title={`Resolver: ${selected?.title ?? ''}`}>
        <View style={{ gap: 12 }}>
          <Input
            label="Respuesta al residente"
            multiline
            numberOfLines={4}
            style={{ minHeight: 100, textAlignVertical: 'top', paddingTop: 12 }}
            value={response}
            onChangeText={setResponse}
          />
          <Btn disabled={!response.trim()} onPress={resolve}>Marcar resuelto</Btn>
        </View>
      </BottomSheet>
    </Screen>
  )
}
