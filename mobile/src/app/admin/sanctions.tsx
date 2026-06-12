import { yupResolver } from '@hookform/resolvers/yup'
import dayjs from 'dayjs'
import React, { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { BottomSheet, Btn, Card, EmptyState, Icon, Screen, StatusChip } from '../../components/ui'
import * as db from '../../data/db'
import { useDataVersion } from '../../data/version'
import { FormInput, FormSelect } from '../../forms/fields'
import { sanctionSchema, type SanctionForm } from '../../forms/schemas'
import { useCollection } from '../../hooks/useCollection'
import { useAuth, useComplexId } from '../../stores/auth'
import { confirmAsk } from '../../stores/confirm'
import { colors, weight } from '../../theme'
import type { Complex, Sanction, SanctionStatus, Unit } from '../../types'

const fmtCOP = (n: number) => `$${n.toLocaleString('es-CO')}`

const FINE_STATUS: Record<string, { label: string; chip: string }> = {
  pending: { label: 'Pendiente', chip: 'pending' },
  paid: { label: 'Pagada', chip: 'completed' },
  cancelled: { label: 'Anulada', chip: 'cancelled' },
}

export default function AdminSanctions() {
  const user = useAuth((s) => s.user)
  const complexId = useComplexId()
  const version = useDataVersion((s) => s.version)
  const complex = useMemo(
    () => (complexId ? db.find<Complex & { id: string }>('complexes', complexId) : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [complexId, version],
  )
  const towers = complex?.towers ?? []
  // Las archivadas salen de esta vista pero se conservan en facturación/contabilidad
  const items = useCollection<Sanction>('sanctions', (x) => !x.archived, (a, b) => b.createdAt - a.createdAt)

  const [open, setOpen] = useState(false)

  const { control, handleSubmit, watch, setValue, reset, formState } = useForm<SanctionForm>({
    resolver: yupResolver(sanctionSchema),
    mode: 'onChange',
    defaultValues: {
      type: 'fine',
      tower: towers.length === 1 ? towers[0] : '',
      apartmentNumber: '', title: '', description: '', amount: '',
    },
  })
  const type = watch('type')

  const save = handleSubmit((v) => {
    if (!complexId || !user) return
    const tower = v.tower || towers[0] || ''
    const unit = db
      .list<Unit>(db.col(complexId, 'units'))
      .find((u) => u.number === v.apartmentNumber.trim() && (!tower || u.tower === tower))

    db.add(db.col(complexId, 'sanctions'), {
      ...(unit ? { unitId: unit.id } : {}),
      ...(tower ? { tower } : {}),
      apartmentNumber: v.apartmentNumber.trim(),
      type: v.type,
      title: v.title.trim(),
      description: v.description.trim(),
      ...(v.type === 'fine' ? { amount: Number(v.amount), status: 'pending' } : {}),
      issuedBy: user.id,
    })

    // Notificar a TODOS los vinculados a la unidad: propietarios y habitantes
    const recipients = [...(unit?.ownerIds ?? []), ...(unit?.tenantIds ?? [])]
    for (const recipientId of recipients) {
      db.add(db.col(complexId, 'notifications'), {
        recipientId,
        title: v.type === 'fine' ? '⚖️ Nueva multa para tu unidad' : '⚠️ Llamado de atención',
        body: `${v.title.trim()} — ${tower ? `${tower} · ` : ''}Apto ${v.apartmentNumber.trim()}`,
        type: 'sanction',
        isRead: false,
      })
    }

    setOpen(false)
    reset({ type: v.type, tower, apartmentNumber: '', title: '', description: '', amount: '' })
  })

  function setStatus(x: Sanction, status: SanctionStatus) {
    if (complexId) db.update(db.col(complexId, 'sanctions'), x.id, { status })
  }

  async function archive(x: Sanction) {
    const ok = await confirmAsk({
      title: x.type === 'fine' ? '¿Archivar multa?' : '¿Archivar llamado de atención?',
      message: `${x.title} saldrá de las vistas activas, pero su registro se conserva en Facturación/Contabilidad.`,
      confirmText: 'Archivar',
      danger: false,
    })
    if (ok && complexId) db.update(db.col(complexId, 'sanctions'), x.id, { archived: true })
  }

  return (
    <Screen title="Multas y llamados">
      <Text style={s.intro}>
        Emite multas o llamados de atención a una unidad. Los verán el propietario y quien habita el apartamento.
      </Text>
      <Btn icon="plus" onPress={() => setOpen(true)} style={{ marginBottom: 16 }}>Emitir sanción</Btn>

      {items.length === 0 ? (
        <EmptyState icon="gavel" message="No has emitido multas ni llamados" />
      ) : (
        <View style={{ gap: 10 }}>
          {items.map((x) => {
            const isFine = x.type === 'fine'
            const meta = isFine ? FINE_STATUS[x.status ?? 'pending'] : null
            return (
              <Card key={x.id} style={{ gap: 8 }}>
                <View style={s.head}>
                  <View style={[s.icon, { backgroundColor: isFine ? colors.errorSoft : '#FEF9C3' }]}>
                    <Icon name={isFine ? 'gavel' : 'alert-outline'} size={20} color={isFine ? colors.error : '#A16207'} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={s.title}>{x.title}</Text>
                    <Text style={s.meta}>
                      {x.tower ? `${x.tower} · ` : ''}Apto {x.apartmentNumber} · {dayjs(x.createdAt).format('D MMM YYYY')}
                      {isFine && x.amount != null ? ` · ${fmtCOP(x.amount)}` : ''}
                    </Text>
                  </View>
                  {isFine
                    ? <StatusChip status={meta!.chip} label={meta!.label} />
                    : <StatusChip status="pending" label="Llamado" />}
                </View>
                <View style={s.actions}>
                  {isFine && x.status === 'pending' && (
                    <>
                      <Pressable style={s.action} onPress={() => setStatus(x, 'paid')}>
                        <Icon name="check-circle-outline" size={15} color={colors.success} />
                        <Text style={[s.actionText, { color: colors.success }]}>Marcar pagada</Text>
                      </Pressable>
                      <Pressable style={s.action} onPress={() => setStatus(x, 'cancelled')}>
                        <Icon name="cancel" size={15} color={colors.textSecondary} />
                        <Text style={s.actionText}>Anular</Text>
                      </Pressable>
                    </>
                  )}
                  <Pressable style={s.action} onPress={() => archive(x)}>
                    <Icon name="archive-arrow-down-outline" size={15} color={colors.textSecondary} />
                    <Text style={s.actionText}>Archivar</Text>
                  </Pressable>
                </View>
              </Card>
            )
          })}
        </View>
      )}

      <BottomSheet visible={open} onClose={() => setOpen(false)} title="Emitir sanción">
        <View style={{ gap: 12 }}>
          <View style={s.typeTabs}>
            {([['fine', 'Multa', 'gavel'], ['warning', 'Llamado de atención', 'alert-outline']] as const).map(([key, label, icon]) => (
              <Pressable
                key={key}
                style={[s.typeTab, type === key && s.typeTabOn]}
                onPress={() => setValue('type', key, { shouldValidate: true })}
              >
                <Icon name={icon} size={16} color={type === key ? colors.admin : colors.textSecondary} />
                <Text style={[s.typeTabText, type === key && { color: colors.admin }]}>{label}</Text>
              </Pressable>
            ))}
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            {towers.length > 1 && (
              <View style={{ flex: 1 }}>
                <FormSelect control={control} name="tower" label="Torre" options={towers.map((t) => ({ value: t, title: t }))} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <FormInput control={control} name="apartmentNumber" label="Apto" placeholder="101" keyboardType="number-pad" />
            </View>
          </View>
          <FormInput control={control} name="title" label="Título" placeholder="Multa por ruido excesivo" />
          <FormInput
            control={control}
            name="description"
            label="Descripción (opcional)"
            multiline
            numberOfLines={3}
            style={{ minHeight: 80, textAlignVertical: 'top', paddingTop: 12 }}
          />
          {type === 'fine' && (
            <FormInput control={control} name="amount" label="Valor (COP)" placeholder="200000" keyboardType="number-pad" />
          )}
          <Btn disabled={!formState.isValid} onPress={save}>Emitir</Btn>
        </View>
      </BottomSheet>
    </Screen>
  )
}

const s = StyleSheet.create({
  intro: { ...weight.regular, fontSize: 14.5, color: colors.textSecondary, lineHeight: 19, marginBottom: 14 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 14.5, ...weight.bold, color: colors.text },
  meta: { ...weight.regular, fontSize: 12.5, color: colors.textTertiary, marginTop: 1 },
  actions: {
    flexDirection: 'row', gap: 16, paddingTop: 8,
    borderTopWidth: 1, borderTopColor: colors.borderLight,
  },
  action: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionText: { fontSize: 13, ...weight.semibold, color: colors.textSecondary },

  typeTabs: { flexDirection: 'row', gap: 8 },
  typeTab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: colors.surface2, borderRadius: 12, paddingVertical: 11,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  typeTabOn: { borderColor: colors.admin, backgroundColor: '#E0F2FE' },
  typeTabText: { fontSize: 13.5, ...weight.semibold, color: colors.textSecondary },
})
