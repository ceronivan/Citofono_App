import dayjs from 'dayjs'
import React, { useState } from 'react'
import { View } from 'react-native'
import { DateField } from '../../components/DateField'
import { BottomSheet, Btn, EmptyState, Input, ListRow, Screen, SelectSheet, StatusChip } from '../../components/ui'
import * as db from '../../data/db'
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
  const [asset, setAsset] = useState('elevator')
  const [title, setTitle] = useState('')
  const [provider, setProvider] = useState('')
  const [date, setDate] = useState('')
  const [recurrence, setRecurrence] = useState<MaintenanceRecurrence>('monthly')

  function save() {
    if (!complexId) return
    const opt = ASSETS.find((a) => a.value === asset)
    db.add(db.col(complexId, 'maintenances'), {
      asset, assetLabel: opt?.title ?? asset,
      title: title.trim(), provider: provider.trim(),
      scheduledDate: new Date(`${date.trim()}T09:00:00`).getTime(),
      recurrence, status: 'scheduled',
    })
    setOpen(false)
    setTitle(''); setProvider(''); setDate('')
  }

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
          <SelectSheet label="Equipo / Zona" value={asset} options={ASSETS.map((a) => ({ value: a.value, title: a.title, icon: a.icon }))} onChange={setAsset} />
          <Input label="Título" placeholder="Mantenimiento preventivo" value={title} onChangeText={setTitle} />
          <Input label="Proveedor (opcional)" placeholder="Ascensores S.A." value={provider} onChangeText={setProvider} />
          <DateField label="Fecha" value={date} onChange={setDate} />
          <SelectSheet label="Recurrencia" value={recurrence} options={RECURRENCE} onChange={setRecurrence} />
          <Btn disabled={!title.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(date.trim())} onPress={save}>Programar</Btn>
        </View>
      </BottomSheet>
    </Screen>
  )
}
