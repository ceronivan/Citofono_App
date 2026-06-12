import { yupResolver } from '@hookform/resolvers/yup'
import React, { useMemo, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import * as db from '../data/db'
import { FormInput, FormSelect } from '../forms/fields'
import { ticketSchema, type TicketForm } from '../forms/schemas'
import { useCollection } from '../hooks/useCollection'
import { useAuth, useComplexId, useMembership } from '../stores/auth'
import { colors, weight } from '../theme'
import type { PQRCategory } from '../types'
import { BottomSheet, Btn, EmptyState, ListRow, Screen, StatusChip } from './ui'
import { useForm } from 'react-hook-form'

interface Ticket {
  id: string
  authorId: string
  apartmentNumber?: string
  tower?: string
  title: string
  description: string
  status: string
  category?: PQRCategory
  adminResponse?: string
  createdAt: number
}

const CATEGORIES: { value: PQRCategory; title: string }[] = [
  { value: 'noise', title: 'Ruido' },
  { value: 'damage', title: 'Daños' },
  { value: 'services', title: 'Servicios' },
  { value: 'security', title: 'Seguridad' },
  { value: 'admin', title: 'Administración' },
  { value: 'other', title: 'Otro' },
]

/** Módulo compartido por PQRs y Reportes de Daños (residente crea, ve estado).
 *  scope 'author': solo lo que creó el usuario (PQRs).
 *  scope 'unit':   todo lo de la unidad — lo ven dueño y habitante (daños). */
export function TicketModule({
  collection,
  title,
  icon,
  createLabel,
  withCategory,
  emptyMessage,
  scope = 'author',
}: {
  collection: 'pqrs' | 'damageReports'
  title: string
  icon: string
  createLabel: string
  withCategory?: boolean
  emptyMessage: string
  scope?: 'author' | 'unit'
}) {
  const user = useAuth((s) => s.user)
  const membership = useMembership()
  const complexId = useComplexId()
  const items = useCollection<Ticket>(
    collection,
    scope === 'unit'
      ? (t) =>
          t.apartmentNumber === membership?.apartmentNumber &&
          (!t.tower || !membership?.tower || t.tower === membership.tower)
      : (t) => t.authorId === user?.id,
    (a, b) => b.createdAt - a.createdAt,
  )

  const [open, setOpen] = useState(false)

  const schema = useMemo(() => ticketSchema(!!withCategory), [withCategory])
  const { control, handleSubmit, reset, formState } = useForm<TicketForm>({
    resolver: yupResolver(schema),
    mode: 'onChange',
    defaultValues: { category: '', title: '', description: '' },
  })

  const save = handleSubmit((v) => {
    if (!complexId || !user) return
    db.add(db.col(complexId, collection), {
      authorId: user.id,
      apartmentNumber: membership?.apartmentNumber ?? '',
      ...(membership?.tower ? { tower: membership.tower } : {}),
      ...(withCategory && v.category ? { category: v.category as PQRCategory } : {}),
      title: v.title.trim(),
      description: v.description.trim(),
      status: 'pending',
    })
    setOpen(false)
    reset()
  })

  return (
    <Screen title={title}>
      <Btn icon="plus" onPress={() => setOpen(true)} style={{ marginBottom: 16 }}>{createLabel}</Btn>
      {items.length === 0 ? (
        <EmptyState icon={icon} message={emptyMessage} />
      ) : (
        <View style={{ gap: 10 }}>
          {items.map((t) => (
            <View key={t.id}>
              <ListRow
                icon={icon}
                iconBg={colors.errorSoft}
                iconColor={colors.error}
                title={t.title}
                subtitle={t.description}
                right={<StatusChip status={t.status} />}
              />
              {t.adminResponse ? (
                <View style={s.response}>
                  <Text style={s.responseLabel}>Respuesta de la administración</Text>
                  <Text style={s.responseText}>{t.adminResponse}</Text>
                </View>
              ) : null}
            </View>
          ))}
        </View>
      )}

      <BottomSheet visible={open} onClose={() => setOpen(false)} title={createLabel}>
        <View style={{ gap: 12 }}>
          {withCategory && (
            <FormSelect control={control} name="category" label="Categoría" options={CATEGORIES} />
          )}
          <FormInput control={control} name="title" label="Título" />
          <FormInput
            control={control}
            name="description"
            label="Descripción"
            multiline
            numberOfLines={4}
            style={{ minHeight: 100, textAlignVertical: 'top', paddingTop: 12 }}
          />
          <Btn disabled={!formState.isValid} onPress={save}>
            Guardar
          </Btn>
        </View>
      </BottomSheet>
    </Screen>
  )
}

const s = StyleSheet.create({
  response: {
    backgroundColor: colors.successSoft,
    borderRadius: 12, padding: 12,
    marginTop: -4, marginHorizontal: 8,
  },
  responseLabel: { fontSize: 12, ...weight.bold, color: '#15803D', textTransform: 'uppercase', letterSpacing: 0.4 },
  responseText: { ...weight.regular, fontSize: 13.5, color: '#166534', marginTop: 3, lineHeight: 18 },
})
