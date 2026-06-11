import { yupResolver } from '@hookform/resolvers/yup'
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Btn, Screen } from '../../components/ui'
import * as db from '../../data/db'
import { FormInput } from '../../forms/fields'
import { visitSchema, type VisitForm } from '../../forms/schemas'
import { useAuth, useComplexId } from '../../stores/auth'
import { colors, weight } from '../../theme'
import type { Unit, VisitType } from '../../types'

export default function RegisterVisit() {
  const user = useAuth((s) => s.user)
  const complexId = useComplexId()
  const [done, setDone] = useState(false)

  const { control, handleSubmit, watch, setValue, reset, formState } = useForm<VisitForm>({
    resolver: yupResolver(visitSchema),
    mode: 'onChange',
    defaultValues: { type: 'pedestrian', apt: '', name: '', idNumber: '', plate: '' },
  })
  const type = watch('type') as VisitType

  const save = handleSubmit((v) => {
    if (!complexId || !user) return
    // Notificar al residente dueño del apto (si existe)
    const unit = db
      .list<Unit>(db.col(complexId, 'units'))
      .find((u) => u.number === v.apt.trim())
    const residentId = unit?.ownerIds[0]

    db.add(db.col(complexId, 'visits'), {
      type: v.type,
      guardId: user.id,
      apartmentNumber: v.apt.trim(),
      ...(residentId ? { residentId } : {}),
      ...(v.type === 'pedestrian'
        ? { visitorName: v.name.trim(), ...(v.idNumber.trim() ? { visitorIdNumber: v.idNumber.trim() } : {}) }
        : { driverName: v.name.trim(), vehiclePlate: v.plate.trim().toUpperCase() }),
      entryTime: Date.now(),
      exitTime: null,
    })
    if (residentId) {
      db.add(db.col(complexId, 'notifications'), {
        recipientId: residentId,
        title: '🚶 Visita en portería',
        body: `${v.name.trim()} está en portería para tu apartamento.`,
        type: 'visit',
        isRead: false,
      })
    }
    setDone(true)
    setTimeout(() => {
      setDone(false)
      reset({ type: v.type, apt: '', name: '', idNumber: '', plate: '' })
    }, 2000)
  })

  return (
    <Screen title="Registrar Visita" showBack={false}>
      <View style={s.tabs}>
        {([['pedestrian', 'Peatonal'], ['vehicle', 'Vehículo']] as const).map(([key, label]) => (
          <Pressable
            key={key}
            style={[s.tab, type === key && s.tabOn]}
            onPress={() => setValue('type', key, { shouldValidate: true })}
          >
            <Text style={[s.tabText, type === key && { color: '#fff' }]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={{ gap: 13 }}>
        <FormInput control={control} name="apt" label="Apto destino" placeholder="101" keyboardType="number-pad" />
        <FormInput
          control={control}
          name="name"
          label={type === 'pedestrian' ? 'Nombre del visitante' : 'Nombre del conductor'}
        />
        {type === 'pedestrian' ? (
          <FormInput control={control} name="idNumber" label="Cédula (opcional)" keyboardType="number-pad" />
        ) : (
          <FormInput control={control} name="plate" label="Placa del vehículo" placeholder="ABC123" autoCapitalize="characters" maxLength={7} />
        )}
        <Btn variant="success" icon="check" disabled={!formState.isValid || done} onPress={save}>
          {done ? '✓ Visita registrada' : 'Registrar Visita'}
        </Btn>
      </View>
    </Screen>
  )
}

const s = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tab: {
    flex: 1, paddingVertical: 12, borderRadius: 9999,
    backgroundColor: colors.surface, alignItems: 'center',
  },
  tabOn: { backgroundColor: colors.guard },
  tabText: { fontSize: 14, ...weight.bold, color: colors.textSecondary },
})
