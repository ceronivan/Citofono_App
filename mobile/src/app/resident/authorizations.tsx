import { yupResolver } from '@hookform/resolvers/yup'
import dayjs from 'dayjs'
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { BottomSheet, Btn, EmptyState, Icon, ListRow, Screen, StatusChip } from '../../components/ui'
import * as db from '../../data/db'
import { FormInput } from '../../forms/fields'
import { authorizationSchema, type AuthorizationForm } from '../../forms/schemas'
import { useCollection } from '../../hooks/useCollection'
import { useAuth, useComplexId, useMembership } from '../../stores/auth'
import { confirmAsk } from '../../stores/confirm'
import { colors, weight } from '../../theme'
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

  const { control, handleSubmit, watch, setValue, reset, formState } = useForm<AuthorizationForm>({
    resolver: yupResolver(authorizationSchema),
    mode: 'onChange',
    defaultValues: {
      type: 'person',
      firstName: '', lastName: '', idNumber: '',
      plate: '', vehicleDescription: '', days: '30',
    },
  })
  const type = watch('type')

  const save = handleSubmit((v) => {
    if (!complexId || !user) return
    db.add(db.col(complexId, 'authorizations'), {
      type: v.type,
      grantedBy: user.id,
      apartmentNumber: membership?.apartmentNumber ?? '',
      ...(membership?.tower ? { tower: membership.tower } : {}),
      ...(v.type === 'person'
        ? { person: { firstName: v.firstName.trim(), lastName: v.lastName.trim(), idNumber: v.idNumber.trim() } }
        : {
            vehicle: {
              plate: v.plate.trim().toUpperCase(),
              ...(v.vehicleDescription.trim() ? { description: v.vehicleDescription.trim() } : {}),
            },
          }),
      validFrom: Date.now(),
      validUntil: Date.now() + Number(v.days) * 86400_000,
    })
    setOpen(false)
    reset({ type: v.type, firstName: '', lastName: '', idNumber: '', plate: '', vehicleDescription: '', days: '30' })
  })

  async function remove(a: Authorization) {
    const who = a.vehicle ? `El vehículo ${a.vehicle.plate}` : `${a.person?.firstName} ${a.person?.lastName}`
    const ok = await confirmAsk({
      title: '¿Eliminar autorización?',
      message: `${who} ya no podrá ingresar con esta autorización.`,
    })
    if (ok && complexId) db.remove(db.col(complexId, 'authorizations'), a.id)
  }

  return (
    <Screen title="Mis Autorizaciones">
      <Text style={s.intro}>
        Autoriza el ingreso de personas recurrentes o vehículos de visita por un tiempo definido.
      </Text>
      <Btn icon="plus" onPress={() => setOpen(true)} style={{ marginBottom: 16 }}>Agregar Autorización</Btn>
      {items.length === 0 ? (
        <EmptyState icon="shield-check-outline" message="No has autorizado a nadie aún" />
      ) : (
        <View style={{ gap: 10 }}>
          {items.map((a) => {
            const active = a.validUntil > Date.now()
            const isVehicle = a.type === 'vehicle' || !!a.vehicle
            return (
              <ListRow
                key={a.id}
                icon={isVehicle ? 'car-clock' : 'account-check-outline'}
                iconBg={active ? colors.successSoft : colors.surface2}
                iconColor={active ? colors.success : colors.textTertiary}
                title={isVehicle ? `Vehículo · ${a.vehicle?.plate}` : `${a.person?.firstName} ${a.person?.lastName}`}
                subtitle={isVehicle ? a.vehicle?.description ?? 'Vehículo de visita' : `CC ${a.person?.idNumber}`}
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
          <View style={s.typeTabs}>
            {([['person', 'Persona', 'account-outline'], ['vehicle', 'Vehículo (visita)', 'car-outline']] as const).map(([key, label, icon]) => (
              <Pressable
                key={key}
                style={[s.typeTab, type === key && s.typeTabOn]}
                onPress={() => setValue('type', key, { shouldValidate: true })}
              >
                <Icon name={icon} size={16} color={type === key ? colors.primary : colors.textSecondary} />
                <Text style={[s.typeTabText, type === key && { color: colors.primary }]}>{label}</Text>
              </Pressable>
            ))}
          </View>

          {type === 'person' ? (
            <>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}><FormInput control={control} name="firstName" label="Nombre" /></View>
                <View style={{ flex: 1 }}><FormInput control={control} name="lastName" label="Apellido" /></View>
              </View>
              <FormInput control={control} name="idNumber" label="Cédula" keyboardType="number-pad" />
            </>
          ) : (
            <>
              <FormInput control={control} name="plate" label="Placa" placeholder="ABC123" autoCapitalize="characters" maxLength={7} />
              <FormInput control={control} name="vehicleDescription" label="Descripción (opcional)" placeholder="Renault Logan blanco — visita" />
            </>
          )}
          <FormInput control={control} name="days" label="Días de validez" keyboardType="number-pad" />
          <Btn disabled={!formState.isValid} onPress={save}>Guardar</Btn>
        </View>
      </BottomSheet>
    </Screen>
  )
}

const s = StyleSheet.create({
  intro: { ...weight.regular, fontSize: 14.5, color: colors.textSecondary, lineHeight: 19, marginBottom: 14 },
  typeTabs: { flexDirection: 'row', gap: 8 },
  typeTab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: colors.surface2, borderRadius: 12, paddingVertical: 11,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  typeTabOn: { borderColor: colors.primary, backgroundColor: colors.primary10 },
  typeTabText: { fontSize: 13.5, ...weight.semibold, color: colors.textSecondary },
})
