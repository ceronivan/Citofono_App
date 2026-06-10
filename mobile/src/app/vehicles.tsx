import React, { useState } from 'react'
import { Pressable, View } from 'react-native'
import { BottomSheet, Btn, EmptyState, Icon, Input, ListRow, Screen, SelectSheet } from '../components/ui'
import * as db from '../data/db'
import { useCollection } from '../hooks/useCollection'
import { useAuth, useComplexId, useMembership } from '../stores/auth'
import { confirmAsk } from '../stores/confirm'
import { colors } from '../theme'
import type { Vehicle, VehicleType } from '../types'

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
  const items = useCollection<Vehicle>('vehicles', (v) => v.ownerId === user?.id)

  const [open, setOpen] = useState(false)
  const [type, setType] = useState<VehicleType | ''>('')
  const [brand, setBrand] = useState('')
  const [color, setColor] = useState('')
  const [plate, setPlate] = useState('')

  function save() {
    if (!complexId || !user || !type) return
    db.add(db.col(complexId, 'vehicles'), {
      ownerId: user.id,
      apartmentNumber: membership?.apartmentNumber ?? '',
      type, brand: brand.trim(), color: color.trim(), plate: plate.trim().toUpperCase(),
    })
    setOpen(false)
    setType(''); setBrand(''); setColor(''); setPlate('')
  }

  async function remove(v: Vehicle) {
    const ok = await confirmAsk({
      title: '¿Eliminar vehículo?',
      message: `${TYPE_LABEL[v.type]} ${v.brand} · placa ${v.plate}. Esta acción no se puede deshacer.`,
    })
    if (ok && complexId) db.remove(db.col(complexId, 'vehicles'), v.id)
  }

  return (
    <Screen title="Mis Vehículos">
      <Btn icon="plus" onPress={() => setOpen(true)} style={{ marginBottom: 16 }}>Agregar Vehículo</Btn>
      {items.length === 0 ? (
        <EmptyState icon="car-outline" message="No tienes vehículos registrados" />
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
                <Pressable onPress={() => remove(v)} hitSlop={8}>
                  <Icon name="delete-outline" size={20} color={colors.error} />
                </Pressable>
              }
            />
          ))}
        </View>
      )}

      <BottomSheet visible={open} onClose={() => setOpen(false)} title="Agregar vehículo">
        <View style={{ gap: 12 }}>
          <SelectSheet
            label="Tipo de vehículo"
            value={type}
            options={(Object.keys(TYPE_LABEL) as VehicleType[]).map((t) => ({ value: t, title: TYPE_LABEL[t], icon: TYPE_ICON[t] }))}
            onChange={setType}
          />
          <Input label="Marca" placeholder="Mazda" value={brand} onChangeText={setBrand} />
          <Input label="Color" placeholder="Gris" value={color} onChangeText={setColor} />
          <Input label="Placa" placeholder="ABC123" autoCapitalize="characters" maxLength={7} value={plate} onChangeText={setPlate} />
          <Btn disabled={!type || !brand.trim() || !plate.trim()} onPress={save}>Guardar</Btn>
        </View>
      </BottomSheet>
    </Screen>
  )
}
