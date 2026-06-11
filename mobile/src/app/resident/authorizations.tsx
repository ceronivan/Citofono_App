import { yupResolver } from '@hookform/resolvers/yup'
import dayjs from 'dayjs'
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Pressable, View } from 'react-native'
import { BottomSheet, Btn, EmptyState, Icon, ListRow, Screen, StatusChip } from '../../components/ui'
import * as db from '../../data/db'
import { FormInput } from '../../forms/fields'
import { authorizationSchema, type AuthorizationForm } from '../../forms/schemas'
import { useCollection } from '../../hooks/useCollection'
import { useAuth, useComplexId, useMembership } from '../../stores/auth'
import { confirmAsk } from '../../stores/confirm'
import { colors } from '../../theme'
import type { Authorization } from '../../types'

export default function Authorizations() {
  const user = useAuth((s) => s.user)
  const membership = useMembership()
  const complexId = useComplexId()
  const items = useCollection<Authorization>(
    'authorizations',
    (a) => a.grantedBy === user?.id,
    (a, b) => b.validUntil - a.validUntil,
  )

  const [open, setOpen] = useState(false)

  const { control, handleSubmit, reset, formState } = useForm<AuthorizationForm>({
    resolver: yupResolver(authorizationSchema),
    mode: 'onChange',
    defaultValues: { firstName: '', lastName: '', idNumber: '', days: '30' },
  })

  const save = handleSubmit((v) => {
    if (!complexId || !user) return
    db.add(db.col(complexId, 'authorizations'), {
      grantedBy: user.id,
      apartmentNumber: membership?.apartmentNumber ?? '',
      person: { firstName: v.firstName.trim(), lastName: v.lastName.trim(), idNumber: v.idNumber.trim() },
      validFrom: Date.now(),
      validUntil: Date.now() + Number(v.days) * 86400_000,
    })
    setOpen(false)
    reset()
  })

  async function remove(a: Authorization) {
    const ok = await confirmAsk({
      title: '¿Eliminar autorización?',
      message: `${a.person.firstName} ${a.person.lastName} ya no podrá ingresar con esta autorización.`,
    })
    if (ok && complexId) db.remove(db.col(complexId, 'authorizations'), a.id)
  }

  return (
    <Screen title="Mis Autorizaciones">
      <Btn icon="plus" onPress={() => setOpen(true)} style={{ marginBottom: 16 }}>Agregar Autorización</Btn>
      {items.length === 0 ? (
        <EmptyState icon="shield-check-outline" message="No has autorizado a nadie aún" />
      ) : (
        <View style={{ gap: 10 }}>
          {items.map((a) => {
            const active = a.validUntil > Date.now()
            return (
              <ListRow
                key={a.id}
                icon="account-check-outline"
                iconBg={active ? colors.successSoft : colors.surface2}
                iconColor={active ? colors.success : colors.textTertiary}
                title={`${a.person.firstName} ${a.person.lastName}`}
                subtitle={`CC ${a.person.idNumber}`}
                meta={`Válida ${dayjs(a.validFrom).format('D MMM')} → ${dayjs(a.validUntil).format('D MMM YYYY')}`}
                right={
                  <View style={{ alignItems: 'flex-end', gap: 6 }}>
                    <StatusChip status={active ? 'approved' : 'cancelled'} label={active ? 'Activa' : 'Vencida'} />
                    <Pressable onPress={() => remove(a)} hitSlop={8}>
                      <Icon name="delete-outline" size={18} color={colors.error} />
                    </Pressable>
                  </View>
                }
              />
            )
          })}
        </View>
      )}

      <BottomSheet visible={open} onClose={() => setOpen(false)} title="Agregar autorización">
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}><FormInput control={control} name="firstName" label="Nombre" /></View>
            <View style={{ flex: 1 }}><FormInput control={control} name="lastName" label="Apellido" /></View>
          </View>
          <FormInput control={control} name="idNumber" label="Cédula" keyboardType="number-pad" />
          <FormInput control={control} name="days" label="Días de validez" keyboardType="number-pad" />
          <Btn disabled={!formState.isValid} onPress={save}>Guardar</Btn>
        </View>
      </BottomSheet>
    </Screen>
  )
}
