import dayjs from 'dayjs'
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Card, EmptyState, Icon, Screen, StatusChip } from '../../components/ui'
import { fmtCOP, isOverdue, periodLabel } from '../../data/billing'
import { useCollection } from '../../hooks/useCollection'
import { useMembership } from '../../stores/auth'
import { colors, weight } from '../../theme'
import type { Invoice } from '../../types'

const METHOD_LABEL: Record<string, string> = { transfer: 'transferencia', cash: 'efectivo', other: 'otro medio' }

/** Estado de cuenta de la unidad — cuotas de administración con su detalle.
 *  Lo ven tanto el propietario como quien habita el apartamento. */
export default function Account() {
  const membership = useMembership()
  const items = useCollection<Invoice>(
    'invoices',
    (i) => i.unitId === membership?.unitId,
    (a, b) => b.period.localeCompare(a.period),
  )

  const pendingTotal = items.filter((i) => i.status === 'pending').reduce((s, i) => s + i.total, 0)

  return (
    <Screen title="Estado de cuenta">
      <View style={[s.headerCard, pendingTotal > 0 ? { backgroundColor: '#FEF3C7' } : { backgroundColor: colors.successSoft }]}>
        <Icon
          name={pendingTotal > 0 ? 'alert-circle-outline' : 'check-circle-outline'}
          size={22}
          color={pendingTotal > 0 ? '#B45309' : colors.success}
        />
        <View style={{ flex: 1 }}>
          <Text style={[s.headerTitle, { color: pendingTotal > 0 ? '#B45309' : '#15803D' }]}>
            {pendingTotal > 0 ? `Saldo pendiente: ${fmtCOP(pendingTotal)}` : 'Estás al día'}
          </Text>
          <Text style={s.headerSub}>
            {membership?.tower ? `${membership.tower} · ` : ''}Apto {membership?.apartmentNumber}
          </Text>
        </View>
      </View>

      {items.length === 0 ? (
        <EmptyState icon="receipt-text-outline" message="Aún no hay cuotas generadas para tu unidad" />
      ) : (
        <View style={{ gap: 10 }}>
          {items.map((inv) => {
            const overdue = isOverdue(inv)
            return (
              <Card key={inv.id} style={{ gap: 8 }}>
                <View style={s.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.period}>{periodLabel(inv.period)}</Text>
                    <Text style={s.meta}>
                      {inv.status === 'paid'
                        ? `Pagada el ${dayjs(inv.paidAt).format('D MMM')} (${METHOD_LABEL[inv.paymentMethod ?? 'other']})`
                        : `Vence el ${dayjs(inv.dueDate).format('D [de] MMMM')}`}
                    </Text>
                  </View>
                  <Text style={s.total}>{fmtCOP(inv.total)}</Text>
                  <StatusChip
                    status={inv.status === 'paid' ? 'completed' : overdue ? 'delinquent' : 'pending'}
                    label={inv.status === 'paid' ? 'Pagada' : overdue ? 'Vencida' : 'Pendiente'}
                  />
                </View>
                {inv.items.length > 1 && (
                  <View style={s.items}>
                    {inv.items.map((item, idx) => (
                      <View key={idx} style={s.itemRow}>
                        <Icon
                          name={item.kind === 'fee' ? 'home-city-outline' : item.kind === 'sanction' ? 'gavel' : 'plus-circle-outline'}
                          size={14}
                          color={item.kind === 'sanction' ? colors.error : colors.textTertiary}
                        />
                        <Text style={s.itemLabel} numberOfLines={1}>{item.label}</Text>
                        <Text style={s.itemAmount}>{fmtCOP(item.amount)}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </Card>
            )
          })}
        </View>
      )}

      <Text style={s.note}>
        Los pagos se registran con la administración. Si ya pagaste y no se refleja, contacta a tu administrador.
      </Text>
    </Screen>
  )
}

const s = StyleSheet.create({
  headerCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 16, padding: 14, marginBottom: 14,
  },
  headerTitle: { fontSize: 15.5, ...weight.extrabold, letterSpacing: -0.2 },
  headerSub: { ...weight.regular, fontSize: 12.5, color: colors.textSecondary, marginTop: 1 },

  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  period: { fontSize: 14.5, ...weight.bold, color: colors.text, textTransform: 'capitalize' },
  meta: { ...weight.regular, fontSize: 12.5, color: colors.textTertiary, marginTop: 1 },
  total: { fontSize: 14.5, ...weight.bold, color: colors.text },

  items: { gap: 6, borderTopWidth: 1, borderTopColor: colors.borderLight, paddingTop: 8 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  itemLabel: { flex: 1, ...weight.regular, fontSize: 12.5, color: colors.textSecondary },
  itemAmount: { fontSize: 12.5, ...weight.semibold, color: colors.text },

  note: { ...weight.regular, fontSize: 12.5, color: colors.textTertiary, lineHeight: 17, marginTop: 16, textAlign: 'center' },
})
