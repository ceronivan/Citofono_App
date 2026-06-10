import React, { useState } from 'react'
import { View } from 'react-native'
import { Btn, Input, Screen, SelectSheet } from '../../components/ui'
import * as db from '../../data/db'
import { useAuth, useComplexId } from '../../stores/auth'
import type { MailType, Unit } from '../../types'

const TYPES: { value: MailType; title: string; icon: string }[] = [
  { value: 'package', title: 'Paquete', icon: 'package-variant-closed' },
  { value: 'letter', title: 'Carta', icon: 'email-outline' },
  { value: 'document', title: 'Documento', icon: 'file-document-outline' },
  { value: 'other', title: 'Otro', icon: 'inbox-outline' },
]

export default function RegisterMail() {
  const user = useAuth((s) => s.user)
  const complexId = useComplexId()

  const [apt, setApt] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<MailType>('package')
  const [sender, setSender] = useState('')
  const [done, setDone] = useState(false)

  function save() {
    if (!complexId || !user) return
    const unit = db.list<Unit>(db.col(complexId, 'units')).find((u) => u.number === apt.trim())
    const residentId = unit?.ownerIds[0]

    db.add(db.col(complexId, 'mail'), {
      registeredBy: user.id,
      apartmentNumber: apt.trim(),
      ...(residentId ? { residentId } : {}),
      description: description.trim(),
      type,
      ...(sender.trim() ? { sender: sender.trim() } : {}),
      status: 'pending',
    })
    if (residentId) {
      db.add(db.col(complexId, 'notifications'), {
        recipientId: residentId,
        title: '📦 Nueva correspondencia',
        body: `${description.trim()} te espera en portería.`,
        type: 'mail',
        isRead: false,
      })
    }
    setDone(true)
    setTimeout(() => {
      setDone(false)
      setApt(''); setDescription(''); setSender('')
    }, 2000)
  }

  return (
    <Screen title="Registrar Correspondencia" showBack={false}>
      <View style={{ gap: 13 }}>
        <Input label="Apto destino" placeholder="101" keyboardType="number-pad" value={apt} onChangeText={setApt} />
        <SelectSheet label="Tipo" value={type} options={TYPES} onChange={setType} />
        <Input label="Descripción" placeholder="Paquete de Amazon" value={description} onChangeText={setDescription} />
        <Input label="Remitente (opcional)" value={sender} onChangeText={setSender} />
        <Btn variant="success" icon="check" disabled={!apt.trim() || !description.trim() || done} onPress={save}>
          {done ? '✓ Registrado y notificado' : 'Registrar'}
        </Btn>
      </View>
    </Screen>
  )
}
