import { yupResolver } from '@hookform/resolvers/yup'
import dayjs from 'dayjs'
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { View } from 'react-native'
import { BottomSheet, Btn, EmptyState, ListRow, Screen, StatusChip } from '../../components/ui'
import * as db from '../../data/db'
import { FormDate, FormInput, FormSelect } from '../../forms/fields'
import { maintenanceSchema, type MaintenanceForm } from '../../forms/schemas'
import { useCollection } from '../../hooks/useCollection'
import { useComplexId } from '../../stores/auth'
import { confirmAsk } from '../../stores/confirm'
import type { MaintenanceRecurrence, MaintenanceTask } from '../../types'

const ASSETS = [
  { value: 'elevator', title: 'Ascensor', icon: 'elevator-passenger-outline' },
  { value: 'pool', title: 'Piscina', icon: 'pool' },
  { value: 'general', title: 'Zonas comunes', icon: 'office-building-cog-outline' },
]

const RECURRENCE: { value: MaintenanceRecurrence; title: string }[] = [
  { value: 'none', title: 'Única vez' },
  { value: 'weekly', title: 'Semanal' },
  { value: 'monthly', title: 'Mensual' },
  { value: 'quarterly', title: 'Trimestral' },
  { value: 'yearly', title: 'Anual' },
]

export default function AdminMaintenance() {
  const complexId = useComplexId()
  const items = useCollection<MaintenanceTask>('maintenances', undefined, (a, b) => a.scheduledDate - b.scheduledDate)

  const [open, setOpen] = useState(false)

  const { control, handleSubmit, reset, formState } = useForm<MaintenanceForm>({
    resolver: yupResolver(maintenanceSchema),
    mode: 'onChange',
    defaultValues: { asset: 'elevator', title: '', provider: '', date: '', recurrence: 'monthly' },
  })

  const save = handleSubmit((v) => {
    if (!complexId) return
    const opt = ASSETS.find((a) => a.value === v.asset)
    db.add(db.col(complexId, 'maintenances'), {
      asset: v.asset, assetLabel: opt?.title ?? v.asset,
      title: v.title.trim(), provider: v.provider.trim(),
      scheduledDate: new Date(`${v.date.trim()}T09:00:00`).getTime(),
      recurrence: v.recurrence as MaintenanceRecurrence, status: 'scheduled',
    })
    setOpen(false)
    reset()
  })

  async function remove(m: MaintenanceTask) {
    const ok = await confirmAsk({
      title: '¿Eliminar mantenimiento?',
      message: `"${m.title}" (${m.assetLabel}) se quitará del calendario.`,
    })
    if (ok && complexId) db.remove(db.col(complexId, 'maintenances'), m.id)
  }

  function advance(m: MaintenanceTask) {
    if (!complexId) return
    const next = m.status === 'scheduled' ? 'in_progress' : 'completed'
    db.update(db.col(complexId, 'maintenances'), m.id, { status: next })
  }

  return (
    <Screen title="Mantenimientos">
      <Btn icon="plus" onPress={() => setOpen(true)} style={{ marginBottom: 16 }}>Programar mantenimiento</Btn>
      {items.length === 0 ? (
        <EmptyState icon="wrench-clock" message="No hay mantenimientos programados" />
      ) : (
        <View style={{ gap: 10 }}>
          {items.map((m) => (
            <ListRow
              key={m.id}
              icon={ASSETS.find((a) => a.value === m.asset)?.icon ?? 'wrench-outline'}
              title={m.title}
              subtitle={`${m.assetLabel}${m.provider ? ` · ${m.provider}` : ''}`}
              meta={`${dayjs(m.scheduledDate).format('ddd D MMM')} · ${RECURRENCE.find((r) => r.value === m.recurrence)?.title}`}
              right={<StatusChip status={m.status} />}
              onPress={
                m.status === 'completed' || m.status === 'cancelled'
                  ? () => remove(m)
                  : () => advance(m)
              }
            />
          ))}
        </View>
      )}

      <BottomSheet visible={open} onClose={() => setOpen(false)} title="Programar mantenimiento">
        <View style={{ gap: 12 }}>
          <FormSelect control={control} name="asset" label="Equipo / Zona" options={ASSETS.map((a) => ({ value: a.value, title: a.title, icon: a.icon }))} />
          <FormInput control={control} name="title" label="Título" placeholder="Mantenimiento preventivo" />
          <FormInput control={control} name="provider" label="Proveedor (opcional)" placeholder="Ascensores S.A." />
          <FormDate control={control} name="date" label="Fecha" />
          <FormSelect control={control} name="recurrence" label="Recurrencia" options={RECURRENCE} />
          <Btn disabled={!formState.isValid} onPress={save}>Programar</Btn>
        </View>
      </BottomSheet>
    </Screen>
  )
}
