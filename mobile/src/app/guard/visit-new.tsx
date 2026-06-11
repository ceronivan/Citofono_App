import React, { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Btn, Input, Screen } from '../../components/ui'
import * as db from '../../data/db'
import { useAuth, useComplexId } from '../../stores/auth'
import { colors, weight } from '../../theme'
import type { Unit, VisitType } from '../../types'

export default function RegisterVisit() {
  const user = useAuth((s) => s.user)
  const complexId = useComplexId()

  const [type, setType] = useState<VisitType>('pedestrian')
  const [apt, setApt] = useState('')
  const [name, setName] = useState('')
  const [idNumber, setIdNumber] = useState('')
  const [plate, setPlate] = useState('')
  const [done, setDone] = useState(false)

  const canSave = apt.trim() && name.trim() && (type === 'pedestrian' || plate.trim())

  function save() {
    if (!complexId || !user) return
    // Notificar al residente dueño del apto (si existe)
    const unit = db
      .list<Unit>(db.col(complexId, 'units'))
      .find((u) => u.number === apt.trim())
    const residentId = unit?.ownerIds[0]

    db.add(db.col(complexId, 'visits'), {
      type,
      guardId: user.id,
      apartmentNumber: apt.trim(),
      ...(residentId ? { residentId } : {}),
      ...(type === 'pedestrian'
        ? { visitorName: name.trim(), ...(idNumber.trim() ? { visitorIdNumber: idNumber.trim() } : {}) }
        : { driverName: name.trim(), vehiclePlate: plate.trim().toUpperCase() }),
      entryTime: Date.now(),
      exitTime: null,
    })
    if (residentId) {
      db.add(db.col(complexId, 'notifications'), {
        recipientId: residentId,
        title: '🚶 Visita en portería',
        body: `${name.trim()} está en portería para tu apartamento.`,
        type: 'visit',
        isRead: false,
      })
    }
    setDone(true)
    setTimeout(() => {
      setDone(false)
      setApt(''); setName(''); setIdNumber(''); setPlate('')
    }, 2000)
  }

  return (
    <Screen title="Registrar Visita" showBack={false}>
      <View style={s.tabs}>
        {([['pedestrian', 'Peatonal'], ['vehicle', 'Vehículo']] as const).map(([key, label]) => (
          <Pressable key={key} style={[s.tab, type === key && s.tabOn]} onPress={() => setType(key)}>
            <Text style={[s.tabText, type === key && { color: '#fff' }]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={{ gap: 13 }}>
        <Input label="Apto destino" placeholder="101" keyboardType="number-pad" value={apt} onChangeText={setApt} />
        <Input
          label={type === 'pedestrian' ? 'Nombre del visitante' : 'Nombre del conductor'}
          value={name}
          onChangeText={setName}
        />
        {type === 'pedestrian' ? (
          <Input label="Cédula (opcional)" keyboardType="number-pad" value={idNumber} onChangeText={setIdNumber} />
        ) : (
          <Input label="Placa del vehículo" placeholder="ABC123" autoCapitalize="characters" maxLength={7} value={plate} onChangeText={setPlate} />
        )}
        <Btn variant="success" icon="check" disabled={!canSave || done} onPress={save}>
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
