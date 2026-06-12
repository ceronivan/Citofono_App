import dayjs from 'dayjs'
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Card, EmptyState, Icon, Screen, StatusChip } from '../../components/ui'
import { useCollection } from '../../hooks/useCollection'
import { useMembership } from '../../stores/auth'
import { colors, weight } from '../../theme'
import type { Sanction } from '../../types'

const fmtCOP = (n: number) => `$${n.toLocaleString('es-CO')}`

const FINE_STATUS: Record<string, { label: string; chip: string }> = {
  pending: { label: 'Pendiente de pago', chip: 'pending' },
  paid: { label: 'Pagada', chip: 'completed' },
  cancelled: { label: 'Anulada', chip: 'cancelled' },
}

/** Multas y llamados de atención de la unidad — visibles para el propietario
 *  y para quien habita el apartamento. */
export default function Sanctions() {
  const membership = useMembership()
  const items = useCollection<Sanction>(
    'sanctions',
    (x) =>
      !x.archived &&
      x.apartmentNumber === membership?.apartmentNumber &&
      (!x.tower || !membership?.tower || x.tower === membership.tower),
    (a, b) => b.createdAt - a.createdAt,
  )

  return (
    <Screen title="Multas y llamados">
      <Text style={s.intro}>
        Sanciones y llamados de atención emitidos por la administración a tu unidad.
        Los ven tanto el propietario como quien habita el apartamento.
      </Text>
      {items.length === 0 ? (
        <EmptyState icon="gavel" message="Tu unidad no tiene multas ni llamados de atención" />
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
                    <Text style={s.date}>{dayjs(x.createdAt).format('D [de] MMMM, YYYY')}</Text>
                  </View>
                  {isFine
                    ? <StatusChip status={meta!.chip} label={meta!.label} />
                    : <StatusChip status="pending" label="Llamado" />}
                </View>
                {x.description ? <Text style={s.desc}>{x.description}</Text> : null}
                {isFine && x.amount != null && (
                  <View style={s.amountRow}>
                    <Text style={s.amountLabel}>Valor</Text>
                    <Text style={[s.amount, x.status === 'paid' && { color: colors.success }]}>
                      {fmtCOP(x.amount)}
                    </Text>
                  </View>
                )}
              </Card>
            )
          })}
        </View>
      )}
    </Screen>
  )
}

const s = StyleSheet.create({
  intro: { ...weight.regular, fontSize: 14.5, color: colors.textSecondary, lineHeight: 19, marginBottom: 14 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 14.5, ...weight.bold, color: colors.text },
  date: { ...weight.regular, fontSize: 12.5, color: colors.textTertiary, marginTop: 1 },
  desc: { ...weight.regular, fontSize: 13.5, color: colors.textSecondary, lineHeight: 18 },
  amountRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surface2, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
  },
  amountLabel: { fontSize: 12.5, ...weight.semibold, color: colors.textSecondary },
  amount: { fontSize: 16, ...weight.extrabold, color: colors.error, letterSpacing: -0.3 },
})
