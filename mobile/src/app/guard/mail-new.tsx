import { yupResolver } from '@hookform/resolvers/yup'
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { View } from 'react-native'
import { Btn, Screen } from '../../components/ui'
import * as db from '../../data/db'
import { FormInput, FormSelect } from '../../forms/fields'
import { mailSchema, type MailForm } from '../../forms/schemas'
import { useAuth, useComplexId } from '../../stores/auth'
import type { Unit } from '../../types'

const TYPES = [
  { value: 'package', title: 'Paquete', icon: 'package-variant-closed' },
  { value: 'letter', title: 'Carta', icon: 'email-outline' },
  { value: 'document', title: 'Documento', icon: 'file-document-outline' },
  { value: 'other', title: 'Otro', icon: 'inbox-outline' },
]

export default function RegisterMail() {
  const user = useAuth((s) => s.user)
  const complexId = useComplexId()
  const [done, setDone] = useState(false)

  const { control, handleSubmit, reset, formState } = useForm<MailForm>({
    resolver: yupResolver(mailSchema),
    mode: 'onChange',
    defaultValues: { apt: '', type: 'package', description: '', sender: '' },
  })

  const save = handleSubmit((v) => {
    if (!complexId || !user) return
    const unit = db.list<Unit>(db.col(complexId, 'units')).find((u) => u.number === v.apt.trim())
    const residentId = unit?.ownerIds[0]

    db.add(db.col(complexId, 'mail'), {
      registeredBy: user.id,
      apartmentNumber: v.apt.trim(),
      ...(residentId ? { residentId } : {}),
      description: v.description.trim(),
      type: v.type,
      ...(v.sender.trim() ? { sender: v.sender.trim() } : {}),
      status: 'pending',
    })
    if (residentId) {
      db.add(db.col(complexId, 'notifications'), {
        recipientId: residentId,
        title: '📦 Nueva correspondencia',
        body: `${v.description.trim()} te espera en portería.`,
        type: 'mail',
        isRead: false,
      })
    }
    setDone(true)
    setTimeout(() => {
      setDone(false)
      reset({ apt: '', type: v.type, description: '', sender: '' })
    }, 2000)
  })

  return (
    <Screen title="Registrar Correspondencia" showBack={false}>
      <View style={{ gap: 13 }}>
        <FormInput control={control} name="apt" label="Apto destino" placeholder="101" keyboardType="number-pad" />
        <FormSelect control={control} name="type" label="Tipo" options={TYPES} />
        <FormInput control={control} name="description" label="Descripción" placeholder="Paquete de Amazon" />
        <FormInput control={control} name="sender" label="Remitente (opcional)" />
        <Btn variant="success" icon="check" disabled={!formState.isValid || done} onPress={save}>
          {done ? '✓ Registrado y notificado' : 'Registrar'}
        </Btn>
      </View>
    </Screen>
  )
}
