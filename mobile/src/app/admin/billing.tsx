import { yupResolver } from '@hookform/resolvers/yup'
import dayjs from 'dayjs'
import React, { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Platform, Pressable, Share, StyleSheet, Text, View } from 'react-native'
import { BottomSheet, Btn, Card, EmptyState, Icon, Input, Screen, StatusChip } from '../../components/ui'
import {
  addPeriods,
  buildPeriodCsv,
  currentPeriod,
  fmtCOP,
  generateInvoices,
  isOverdue,
  markInvoicePaid,
  periodLabel,
  summarizePeriod,
  unitFee,
} from '../../data/billing'
import * as db from '../../data/db'
import { useDataVersion } from '../../data/version'
import { FormDate, FormInput, FormSelect } from '../../forms/fields'
import { expenseSchema, feeConfigSchema, type ExpenseForm, type FeeConfigForm } from '../../forms/schemas'
import { useCollection } from '../../hooks/useCollection'
import { useComplexId } from '../../stores/auth'
import { confirmAsk } from '../../stores/confirm'
import { colors, weight } from '../../theme'
import type { Complex, Expense, ExpenseCategory, Invoice, PaymentMethod, Unit } from '../../types'

const CATEGORY_META: Record<ExpenseCategory, { label: string; icon: string }> = {
  security: { label: 'Vigilancia', icon: 'shield-account-outline' },
  cleaning: { label: 'Aseo', icon: 'broom' },
  maintenance: { label: 'Mantenimiento', icon: 'wrench-outline' },
  utilities: { label: 'Servicios públicos', icon: 'flash-outline' },
  gardening: { label: 'Jardinería', icon: 'flower-outline' },
  insurance: { label: 'Seguros', icon: 'shield-check-outline' },
  admin: { label: 'Administrativos', icon: 'file-document-outline' },
  other: { label: 'Otros', icon: 'dots-horizontal-circle-outline' },
}

const METHOD_LABEL: Record<PaymentMethod, string> = { transfer: 'Transferencia', cash: 'Efectivo', other: 'Otro' }

type Segment = 'summary' | 'invoices' | 'expenses'

export default function AdminBilling() {
  const complexId = useComplexId()
  const version = useDataVersion((s) => s.version)
  const [segment, setSegment] = useState<Segment>('summary')
  const [p, setP] = useState(currentPeriod())

  const complex = useMemo(
    () => (complexId ? db.find<Complex & { id: string }>('complexes', complexId) : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [complexId, version],
  )

  const invoices = useCollection<Invoice>('invoices', (i) => i.period === p, (a, b) =>
    `${a.tower ?? ''}${a.apartmentNumber}`.localeCompare(`${b.tower ?? ''}${b.apartmentNumber}`),
  )
  const expenses = useCollection<Expense>(
    'expenses',
    (e) => dayjs(e.date).format('YYYY-MM') === p,
    (a, b) => b.date - a.date,
  )
  const units = useCollection<Unit>('units', undefined, (a, b) => a.label.localeCompare(b.label))

  const summary = useMemo(
    () => (complexId ? summarizePeriod(complexId, p) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [complexId, p, version],
  )
  const history = useMemo(
    () => (complexId ? [-5, -4, -3, -2, -1, 0].map((off) => summarizePeriod(complexId, addPeriods(p, off))) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [complexId, p, version],
  )

  // ── Detalle / pago de cuota ──────────────────────────────────────────────────
  const [selected, setSelected] = useState<Invoice | null>(null)
  const [method, setMethod] = useState<PaymentMethod>('transfer')

  async function pay() {
    if (!complexId || !selected) return
    const ok = await confirmAsk({
      title: '¿Registrar pago?',
      message: `${selected.tower ? `${selected.tower} · ` : ''}Apto ${selected.apartmentNumber} — ${fmtCOP(selected.total)} (${METHOD_LABEL[method]}).`,
      confirmText: 'Sí, registrar',
      danger: false,
    })
    if (!ok) return
    markInvoicePaid(complexId, selected, method)
    setSelected(null)
  }

  function generate() {
    if (!complexId) return
    const created = generateInvoices(complexId, p)
    confirmAsk({
      title: created > 0 ? 'Cuotas generadas' : 'Sin cuotas nuevas',
      message:
        created > 0
          ? `Se generaron ${created} cuotas de ${periodLabel(p)} cruzando las multas pendientes de cada unidad.`
          : `Todas las unidades ya tienen su cuota de ${periodLabel(p)}.`,
      confirmText: 'Entendido',
      cancelText: ' ',
      danger: false,
    })
  }

  // ── Configuración de cuota ───────────────────────────────────────────────────
  const [configOpen, setConfigOpen] = useState(false)
  const [overrideUnit, setOverrideUnit] = useState<Unit | null>(null)
  const [overrideValue, setOverrideValue] = useState('')

  const feeForm = useForm<FeeConfigForm>({
    resolver: yupResolver(feeConfigSchema),
    mode: 'onChange',
    defaultValues: { feeBase: String(complex?.feeBase ?? ''), feeDueDay: String(complex?.feeDueDay ?? 10) },
  })

  function openConfig() {
    feeForm.reset({ feeBase: String(complex?.feeBase ?? ''), feeDueDay: String(complex?.feeDueDay ?? 10) })
    setConfigOpen(true)
  }

  const saveConfig = feeForm.handleSubmit((v) => {
    if (!complexId) return
    db.update('complexes', complexId, { feeBase: Number(v.feeBase), feeDueDay: Number(v.feeDueDay) })
    setConfigOpen(false)
  })

  function saveOverride() {
    if (!complexId || !overrideUnit) return
    const value = overrideValue.trim()
    db.update(db.col(complexId, 'units'), overrideUnit.id, {
      feeOverride: value && Number(value) > 0 ? Number(value) : undefined,
    })
    setOverrideUnit(null)
  }

  // ── Gastos ──────────────────────────────────────────────────────────────────
  const [expenseOpen, setExpenseOpen] = useState(false)
  const expenseForm = useForm<ExpenseForm>({
    resolver: yupResolver(expenseSchema),
    mode: 'onChange',
    defaultValues: { category: '', provider: '', description: '', amount: '', date: dayjs().format('YYYY-MM-DD') },
  })

  const saveExpense = expenseForm.handleSubmit((v) => {
    if (!complexId) return
    db.add(db.col(complexId, 'expenses'), {
      category: v.category as ExpenseCategory,
      provider: v.provider.trim(),
      description: v.description.trim(),
      amount: Number(v.amount),
      date: new Date(`${v.date}T12:00:00`).getTime(),
    })
    setExpenseOpen(false)
    expenseForm.reset({ category: v.category, provider: '', description: '', amount: '', date: dayjs().format('YYYY-MM-DD') })
  })

  async function removeExpense(e: Expense) {
    const ok = await confirmAsk({
      title: '¿Eliminar gasto?',
      message: `${e.provider} — ${fmtCOP(e.amount)} saldrá de la contabilidad de ${periodLabel(p)}.`,
    })
    if (ok && complexId) db.remove(db.col(complexId, 'expenses'), e.id)
  }

  // ── Exportar CSV ─────────────────────────────────────────────────────────────
  async function exportCsv() {
    if (!complexId) return
    const csv = buildPeriodCsv(complexId, p)
    const filename = `contabilidad-${p}.csv`
    if (Platform.OS === 'web') {
      const doc = (globalThis as { document?: Document }).document
      if (!doc) return
      const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' })
      const a = doc.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = filename
      a.click()
      URL.revokeObjectURL(a.href)
    } else {
      await Share.share({ title: filename, message: csv })
    }
  }

  const maxHistory = Math.max(1, ...history.map((h) => Math.max(h.collected, h.expenses)))
  const maxCat = Math.max(1, ...(summary?.expensesByCategory.map((c) => c.amount) ?? []))

  return (
    <Screen title="Facturación">
      {/* Selector de periodo */}
      <View style={s.periodRow}>
        <Pressable style={s.periodBtn} onPress={() => setP(addPeriods(p, -1))} accessibilityLabel="Mes anterior">
          <Icon name="chevron-left" size={20} color={colors.textSecondary} />
        </Pressable>
        <Text style={s.periodLabel}>{periodLabel(p)}</Text>
        <Pressable style={s.periodBtn} onPress={() => setP(addPeriods(p, 1))} accessibilityLabel="Mes siguiente">
          <Icon name="chevron-right" size={20} color={colors.textSecondary} />
        </Pressable>
      </View>

      {/* Segmentos */}
      <View style={s.tabs}>
        {([['summary', 'Resumen'], ['invoices', 'Cuotas'], ['expenses', 'Gastos']] as const).map(([key, label]) => (
          <Pressable key={key} style={[s.tab, segment === key && s.tabOn]} onPress={() => setSegment(key)}>
            <Text style={[s.tabText, segment === key && s.tabTextOn]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      {/* ── RESUMEN ── */}
      {segment === 'summary' && summary && (
        <View style={{ gap: 12 }}>
          <View style={s.kpiRow}>
            <View style={[s.kpi, { backgroundColor: '#DCFCE7' }]}>
              <Text style={s.kpiLabel}>Recaudado</Text>
              <Text style={[s.kpiValue, { color: '#15803D' }]}>{fmtCOP(summary.collected)}</Text>
              <Text style={s.kpiSub}>{summary.paidCount}/{summary.invoiceCount} cuotas · {summary.collectionRate}%</Text>
            </View>
            <View style={[s.kpi, { backgroundColor: colors.errorSoft }]}>
              <Text style={s.kpiLabel}>Gastos</Text>
              <Text style={[s.kpiValue, { color: '#B91C1C' }]}>{fmtCOP(summary.expenses)}</Text>
              <Text style={s.kpiSub}>{expenses.length} pagos a proveedores</Text>
            </View>
          </View>
          <View style={s.kpiRow}>
            <View style={[s.kpi, { backgroundColor: summary.balance >= 0 ? '#E0F2FE' : '#FEF3C7' }]}>
              <Text style={s.kpiLabel}>Saldo del periodo</Text>
              <Text style={[s.kpiValue, { color: summary.balance >= 0 ? '#0369A1' : '#B45309' }]}>
                {fmtCOP(summary.balance)}
              </Text>
              <Text style={s.kpiSub}>recaudado − gastos</Text>
            </View>
            <View style={[s.kpi, { backgroundColor: '#FEF9C3' }]}>
              <Text style={s.kpiLabel}>En mora</Text>
              <Text style={[s.kpiValue, { color: '#A16207' }]}>{summary.overdueCount}</Text>
              <Text style={s.kpiSub}>cuotas vencidas sin pagar</Text>
            </View>
          </View>

          {summary.expensesByCategory.length > 0 && (
            <Card style={{ gap: 10 }}>
              <Text style={s.cardTitle}>Gastos por categoría</Text>
              {summary.expensesByCategory.map((c) => {
                const meta = CATEGORY_META[c.category as ExpenseCategory] ?? CATEGORY_META.other
                return (
                  <View key={c.category} style={{ gap: 4 }}>
                    <View style={s.catRow}>
                      <Icon name={meta.icon} size={15} color={colors.textSecondary} />
                      <Text style={s.catLabel}>{meta.label}</Text>
                      <Text style={s.catValue}>{fmtCOP(c.amount)}</Text>
                    </View>
                    <View style={s.barTrack}>
                      <View style={[s.barFill, { width: `${(c.amount / maxCat) * 100}%` }]} />
                    </View>
                  </View>
                )
              })}
            </Card>
          )}

          <Card style={{ gap: 10 }}>
            <Text style={s.cardTitle}>Evolución — últimos 6 meses</Text>
            <View style={s.chart}>
              {history.map((h) => (
                <View key={h.period} style={s.chartCol}>
                  <View style={s.chartBars}>
                    <View style={[s.chartBar, { height: Math.max(3, (h.collected / maxHistory) * 72), backgroundColor: colors.success }]} />
                    <View style={[s.chartBar, { height: Math.max(3, (h.expenses / maxHistory) * 72), backgroundColor: colors.error }]} />
                  </View>
                  <Text style={s.chartLabel}>{dayjs(`${h.period}-01`).format('MMM')}</Text>
                </View>
              ))}
            </View>
            <View style={s.legend}>
              <View style={[s.legendDot, { backgroundColor: colors.success }]} /><Text style={s.legendText}>Ingresos</Text>
              <View style={[s.legendDot, { backgroundColor: colors.error }]} /><Text style={s.legendText}>Gastos</Text>
            </View>
          </Card>

          <Btn variant="secondary" icon="file-delimited-outline" onPress={exportCsv}>
            Exportar CSV de {periodLabel(p)}
          </Btn>
        </View>
      )}

      {/* ── CUOTAS ── */}
      {segment === 'invoices' && (
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Btn icon="autorenew" style={{ flex: 1 }} onPress={generate}>Generar cuotas</Btn>
            <Btn variant="secondary" icon="cog-outline" onPress={openConfig}>Cuota</Btn>
          </View>

          {invoices.length === 0 ? (
            <EmptyState icon="receipt-text-outline" message={`Aún no se generan cuotas de ${periodLabel(p)}`} />
          ) : (
            <View style={{ gap: 8 }}>
              {invoices.map((inv) => {
                const overdue = isOverdue(inv)
                return (
                  <Pressable key={inv.id} style={s.invRow} onPress={() => { setMethod('transfer'); setSelected(inv) }}>
                    <View style={[s.invIcon, { backgroundColor: inv.status === 'paid' ? colors.successSoft : overdue ? colors.errorSoft : '#FEF9C3' }]}>
                      <Icon
                        name={inv.status === 'paid' ? 'check' : overdue ? 'alert' : 'clock-outline'}
                        size={18}
                        color={inv.status === 'paid' ? colors.success : overdue ? colors.error : '#A16207'}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.invTitle}>{inv.tower ? `${inv.tower} · ` : ''}{inv.apartmentNumber}</Text>
                      <Text style={s.invMeta}>
                        {inv.items.length > 1 ? `${inv.items.length} conceptos · ` : ''}vence {dayjs(inv.dueDate).format('D MMM')}
                      </Text>
                    </View>
                    <Text style={s.invTotal}>{fmtCOP(inv.total)}</Text>
                    <StatusChip
                      status={inv.status === 'paid' ? 'completed' : overdue ? 'delinquent' : 'pending'}
                      label={inv.status === 'paid' ? 'Pagada' : overdue ? 'Vencida' : 'Pendiente'}
                    />
                  </Pressable>
                )
              })}
            </View>
          )}
        </View>
      )}

      {/* ── GASTOS ── */}
      {segment === 'expenses' && (
        <View style={{ gap: 12 }}>
          <Btn icon="plus" onPress={() => setExpenseOpen(true)}>Registrar gasto</Btn>
          {expenses.length === 0 ? (
            <EmptyState icon="cash-minus" message={`Sin gastos registrados en ${periodLabel(p)}`} />
          ) : (
            <View style={{ gap: 8 }}>
              {expenses.map((e) => {
                const meta = CATEGORY_META[e.category] ?? CATEGORY_META.other
                return (
                  <View key={e.id} style={s.invRow}>
                    <View style={[s.invIcon, { backgroundColor: colors.surface2 }]}>
                      <Icon name={meta.icon} size={18} color={colors.textSecondary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.invTitle}>{e.provider}</Text>
                      <Text style={s.invMeta}>{meta.label} · {dayjs(e.date).format('D MMM')}{e.description ? ` · ${e.description}` : ''}</Text>
                    </View>
                    <Text style={[s.invTotal, { color: colors.error }]}>−{fmtCOP(e.amount)}</Text>
                    <Pressable onPress={() => removeExpense(e)} hitSlop={8}>
                      <Icon name="delete-outline" size={18} color={colors.textTertiary} />
                    </Pressable>
                  </View>
                )
              })}
            </View>
          )}
        </View>
      )}

      {/* ── Detalle de cuota ── */}
      <BottomSheet
        visible={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `${selected.tower ? `${selected.tower} · ` : ''}Apto ${selected.apartmentNumber} — ${periodLabel(selected.period)}` : ''}
      >
        {selected && (
          <View style={{ gap: 12 }}>
            <View style={{ gap: 8 }}>
              {selected.items.map((item, idx) => (
                <View key={idx} style={s.itemRow}>
                  <Icon
                    name={item.kind === 'fee' ? 'home-city-outline' : item.kind === 'sanction' ? 'gavel' : 'plus-circle-outline'}
                    size={16}
                    color={item.kind === 'sanction' ? colors.error : colors.textSecondary}
                  />
                  <Text style={s.itemLabel} numberOfLines={2}>{item.label}</Text>
                  <Text style={s.itemAmount}>{fmtCOP(item.amount)}</Text>
                </View>
              ))}
              <View style={[s.itemRow, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 }]}>
                <Text style={[s.itemLabel, weight.bold]}>Total</Text>
                <Text style={[s.itemAmount, { fontSize: 17 }]}>{fmtCOP(selected.total)}</Text>
              </View>
            </View>

            {selected.status === 'paid' ? (
              <View style={s.paidNote}>
                <Icon name="check-circle-outline" size={16} color={colors.success} />
                <Text style={s.paidNoteText}>
                  Pagada el {dayjs(selected.paidAt).format('D [de] MMMM')} ({METHOD_LABEL[selected.paymentMethod ?? 'other']})
                </Text>
              </View>
            ) : (
              <>
                <View style={s.methodRow}>
                  {(Object.keys(METHOD_LABEL) as PaymentMethod[]).map((m) => (
                    <Pressable key={m} style={[s.methodChip, method === m && s.methodChipOn]} onPress={() => setMethod(m)}>
                      <Text style={[s.methodText, method === m && { color: colors.admin }]}>{METHOD_LABEL[m]}</Text>
                    </Pressable>
                  ))}
                </View>
                <Btn variant="success" icon="check" onPress={pay}>Marcar pagada</Btn>
              </>
            )}
          </View>
        )}
      </BottomSheet>

      {/* ── Configuración de cuota ── */}
      <BottomSheet visible={configOpen} onClose={() => setConfigOpen(false)} title="Cuota de administración">
        <View style={{ gap: 12 }}>
          <FormInput control={feeForm.control} name="feeBase" label="Cuota base mensual (COP)" keyboardType="number-pad" placeholder="350000" />
          <FormInput control={feeForm.control} name="feeDueDay" label="Día de vencimiento" keyboardType="number-pad" placeholder="15" />
          <Btn disabled={!feeForm.formState.isValid} onPress={saveConfig}>Guardar</Btn>

          <Text style={s.cardTitle}>Ajustes por unidad</Text>
          <Text style={s.hint}>Toca una unidad para asignarle una cuota distinta de la base.</Text>
          <View style={{ gap: 6 }}>
            {units.map((u) => (
              <Pressable
                key={u.id}
                style={s.unitRow}
                onPress={() => { setOverrideValue(u.feeOverride ? String(u.feeOverride) : ''); setOverrideUnit(u) }}
              >
                <Text style={s.unitLabel}>{u.label}</Text>
                <Text style={[s.unitFee, u.feeOverride ? { color: colors.admin } : null]}>
                  {fmtCOP(unitFee(complex, u))}{u.feeOverride ? ' · ajustada' : ''}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </BottomSheet>

      {/* ── Override de una unidad ── */}
      <BottomSheet
        visible={!!overrideUnit}
        onClose={() => setOverrideUnit(null)}
        title={overrideUnit ? `Cuota de ${overrideUnit.label}` : ''}
      >
        <View style={{ gap: 12 }}>
          <Input
            label={`Cuota mensual (vacío = base ${fmtCOP(complex?.feeBase ?? 0)})`}
            keyboardType="number-pad"
            placeholder={String(complex?.feeBase ?? '')}
            value={overrideValue}
            onChangeText={setOverrideValue}
          />
          <Btn onPress={saveOverride}>Guardar</Btn>
        </View>
      </BottomSheet>

      {/* ── Nuevo gasto ── */}
      <BottomSheet visible={expenseOpen} onClose={() => setExpenseOpen(false)} title="Registrar gasto">
        <View style={{ gap: 12 }}>
          <FormSelect
            control={expenseForm.control}
            name="category"
            label="Categoría"
            options={(Object.keys(CATEGORY_META) as ExpenseCategory[]).map((c) => ({
              value: c, title: CATEGORY_META[c].label, icon: CATEGORY_META[c].icon,
            }))}
          />
          <FormInput control={expenseForm.control} name="provider" label="Proveedor" placeholder="Seguridad Atlas Ltda." />
          <FormInput control={expenseForm.control} name="description" label="Descripción (opcional)" placeholder="Vigilancia 24h — mensualidad" />
          <FormInput control={expenseForm.control} name="amount" label="Valor (COP)" keyboardType="number-pad" placeholder="2800000" />
          <FormDate control={expenseForm.control} name="date" label="Fecha del pago" />
          <Btn disabled={!expenseForm.formState.isValid} onPress={saveExpense}>Guardar</Btn>
        </View>
      </BottomSheet>
    </Screen>
  )
}

const s = StyleSheet.create({
  periodRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 12 },
  periodBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
  },
  periodLabel: { fontSize: 16, ...weight.extrabold, color: colors.text, textTransform: 'capitalize', minWidth: 150, textAlign: 'center' },

  tabs: {
    flexDirection: 'row', gap: 6, marginBottom: 14,
    backgroundColor: colors.surface2, borderRadius: 9999, padding: 4,
  },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 9999, alignItems: 'center' },
  tabOn: { backgroundColor: colors.surface },
  tabText: { fontSize: 13.5, ...weight.semibold, color: colors.textSecondary },
  tabTextOn: { color: colors.admin },

  kpiRow: { flexDirection: 'row', gap: 10 },
  kpi: { flex: 1, borderRadius: 16, padding: 14, gap: 2 },
  kpiLabel: { fontSize: 12.5, ...weight.semibold, color: colors.textSecondary },
  kpiValue: { fontSize: 18, ...weight.extrabold, letterSpacing: -0.4 },
  kpiSub: { ...weight.regular, fontSize: 11.5, color: colors.textSecondary },

  cardTitle: { fontSize: 13.5, ...weight.bold, color: colors.text },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  catLabel: { flex: 1, ...weight.regular, fontSize: 13, color: colors.textSecondary },
  catValue: { fontSize: 13, ...weight.semibold, color: colors.text },
  barTrack: { height: 6, borderRadius: 3, backgroundColor: colors.surface2, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3, backgroundColor: colors.admin },

  chart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 6 },
  chartCol: { alignItems: 'center', gap: 5, flex: 1 },
  chartBars: { flexDirection: 'row', gap: 3, alignItems: 'flex-end', height: 72 },
  chartBar: { width: 9, borderRadius: 3 },
  chartLabel: { fontSize: 11, ...weight.medium, color: colors.textTertiary, textTransform: 'capitalize' },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center' },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11.5, ...weight.medium, color: colors.textSecondary, marginRight: 8 },

  invRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.surface, borderRadius: 14, padding: 11,
  },
  invIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  invTitle: { fontSize: 13.5, ...weight.bold, color: colors.text },
  invMeta: { ...weight.regular, fontSize: 12, color: colors.textTertiary, marginTop: 1 },
  invTotal: { fontSize: 13.5, ...weight.bold, color: colors.text },

  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemLabel: { flex: 1, ...weight.regular, fontSize: 13.5, color: colors.textSecondary },
  itemAmount: { fontSize: 14, ...weight.bold, color: colors.text },
  paidNote: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.successSoft, borderRadius: 12, padding: 12,
  },
  paidNoteText: { flex: 1, fontSize: 13, ...weight.medium, color: '#15803D' },
  methodRow: { flexDirection: 'row', gap: 8 },
  methodChip: {
    flex: 1, alignItems: 'center', paddingVertical: 9,
    backgroundColor: colors.surface2, borderRadius: 10,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  methodChipOn: { borderColor: colors.admin, backgroundColor: '#E0F2FE' },
  methodText: { fontSize: 13, ...weight.semibold, color: colors.textSecondary },

  hint: { ...weight.regular, fontSize: 12.5, color: colors.textTertiary, marginTop: -6 },
  unitRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surface2, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
  },
  unitLabel: { fontSize: 13, ...weight.semibold, color: colors.text },
  unitFee: { ...weight.regular, fontSize: 13, color: colors.textSecondary },
})
