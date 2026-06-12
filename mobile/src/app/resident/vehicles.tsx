import { yupResolver } from '@hookform/resolvers/yup'
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { BottomSheet, Btn, EmptyState, Icon, ListRow, Screen } from '../../components/ui'
import * as db from '../../data/db'
import { FormInput, FormSelect } from '../../forms/fields'
import { vehicleSchema, type VehicleForm } from '../../forms/schemas'
import { useCollection } from '../../hooks/useCollection'
import { isOwner, useAuth, useComplexId, useMembership, useResidentType } from '../../stores/auth'
import { confirmAsk } from '../../stores/confirm'
import { colors, weight } from '../../theme'
import type { Vehicle, VehicleType } from '../../types'

const TYPE_LABEL: Record<VehicleType, string> = {
  car: 'Carro', motorcycle: 'Moto', bicycle: 'Bicicleta', truck: 'Camión', other: 'Otro',
}
const TYPE_ICON: Record<VehicleType, string> = {
  car: 'car-outline', motorcycle: 'motorbike', bicycle: 'bike', truck: 'truck-outline', other: 'help-circle-outline',
}

export default function Vehicles() {
  const user = useAuth((s) => s.user)
  const membership = useMembership()
  const complexId = useComplexId()
  const residentType = useResidentType()
  // Los vehículos pertenecen a la unidad; solo el propietario los gestiona
  const canManage = isOwner(residentType)
  const items = useCollection<Vehicle>(
    'vehicles',
    (v) => (v.unitId ? v.unitId === membership?.unitId : v.ownerId === user?.id),
  )

  const [open, setOpen] = useState(false)

  const { control, handleSubmit, reset, formState } = useForm<VehicleForm>({
    resolver: yupResolver(vehicleSchema),
    mode: 'onChange',
    defaultValues: { type: '', brand: '', color: '', plate: '' },
  })

  const save = handleSubmit((v) => {
    if (!complexId || !user) return
    db.add(db.col(complexId, 'vehicles'), {
      ownerId: user.id,
      ...(membership?.unitId ? { unitId: membership.unitId } : {}),
      ...(membership?.tower ? { tower: membership.tower } : {}),
      apartmentNumber: membership?.apartmentNumber ?? '',
      type: v.type as VehicleType,
      brand: v.brand.trim(),
      color: v.color.trim(),
      plate: v.plate.trim().toUpperCase(),
    })
    setOpen(false)
    reset()
  })

  async function remove(v: Vehicle) {
    const ok = await confirmAsk({
      title: '¿Eliminar vehículo?',
      message: `${TYPE_LABEL[v.type]} ${v.brand} · placa ${v.plate}. Esta acción no se puede deshacer.`,
    })
    if (ok && complexId) db.remove(db.col(complexId, 'vehicles'), v.id)
  }

  return (
    <Screen title="Vehículos de mi unidad">
      {canManage ? (
        <Btn icon="plus" onPress={() => setOpen(true)} style={{ marginBottom: 16 }}>Agregar Vehículo</Btn>
      ) : (
        <View style={st.banner}>
          <Icon name="information-outline" size={16} color="#1D4ED8" />
          <Text style={st.bannerText}>
            El registro de vehículos de la unidad lo gestiona directamente el propietario.
          </Text>
        </View>
      )}
      {items.length === 0 ? (
        <EmptyState icon="car-outline" message="La unidad no tiene vehículos registrados" />
      ) : (
        <View style={{ gap: 10 }}>
          {items.map((v) => (
            <ListRow
              key={v.id}
              icon={TYPE_ICON[v.type]}
              iconBg="#FFF7ED"
              iconColor="#C2410C"
              title={`${TYPE_LABEL[v.type]} ${v.brand}`}
              subtitle={`${v.color} · Placa ${v.plate}`}
              right={
                canManage ? (
                  <Pressable onPress={() => remove(v)} hitSlop={8}>
                    <Icon name="delete-outline" size={20} color={colors.error} />
                  </Pressable>
                ) : undefined
              }
            />
          ))}
        </View>
      )}

      <BottomSheet visible={open} onClose={() => setOpen(false)} title="Agregar vehículo">
        <View style={{ gap: 12 }}>
          <FormSelect
            control={control}
            name="type"
            label="Tipo de vehículo"
            options={(Object.keys(TYPE_LABEL) as VehicleType[]).map((t) => ({ value: t, title: TYPE_LABEL[t], icon: TYPE_ICON[t] }))}
          />
          <FormInput control={control} name="brand" label="Marca" placeholder="Mazda" />
          <FormInput control={control} name="color" label="Color" placeholder="Gris" />
          <FormInput control={control} name="plate" label="Placa" placeholder="ABC123" autoCapitalize="characters" maxLength={7} />
          <Btn disabled={!formState.isValid} onPress={save}>Guardar</Btn>
        </View>
      </BottomSheet>
    </Screen>
  )
}

const st = StyleSheet.create({
  banner: {
    flexDirection: 'row', gap: 8,
    backgroundColor: colors.infoSoft, borderRadius: 12,
    padding: 12, marginBottom: 14,
  },
  bannerText: { flex: 1, ...weight.regular, fontSize: 13, lineHeight: 17, color: '#1D4ED8' },
})
