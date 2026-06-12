/**
 * Lógica de facturación/contabilidad — reemplazo de las tablas de Excel.
 *
 * Una "cuota" (Invoice) por unidad y periodo (YYYY-MM) cruza:
 *   - la cuota de administración (feeOverride de la unidad o feeBase del edificio)
 *   - las multas pendientes de la unidad que aún no se han facturado
 * La mora de la cartera se deriva automáticamente de cuotas vencidas sin pagar.
 */
import dayjs from 'dayjs'
import type {
  Complex, Expense, Invoice, InvoiceItem, PaymentMethod, Sanction, Unit,
} from '../types'
import * as db from './db'

export const fmtCOP = (n: number) => `$${Math.round(n).toLocaleString('es-CO')}`

export const currentPeriod = () => dayjs().format('YYYY-MM')
export const periodLabel = (p: string) => dayjs(`${p}-01`).format('MMMM YYYY')
export const addPeriods = (p: string, n: number) => dayjs(`${p}-01`).add(n, 'month').format('YYYY-MM')

/** Cuota mensual que aplica a una unidad. */
export const unitFee = (complex: Complex | undefined, unit: Unit) =>
  unit.feeOverride ?? complex?.feeBase ?? 0

export const isOverdue = (inv: Invoice) => inv.status === 'pending' && inv.dueDate < Date.now()

/**
 * Genera las cuotas del periodo para todas las unidades que no la tengan aún.
 * Cruza las multas pendientes no facturadas de cada unidad como items adicionales.
 * Devuelve cuántas cuotas se crearon.
 */
export function generateInvoices(complexId: string, period: string): number {
  const complex = db.find<Complex & { id: string }>('complexes', complexId)
  const units = db.list<Unit>(db.col(complexId, 'units'))
  const invoices = db.list<Invoice>(db.col(complexId, 'invoices'))
  const sanctions = db.list<Sanction>(db.col(complexId, 'sanctions'))
  const dueDay = complex?.feeDueDay ?? 10
  const dueDate = dayjs(`${period}-01`).date(dueDay).endOf('day').valueOf()

  let created = 0
  for (const unit of units) {
    if (invoices.some((i) => i.unitId === unit.id && i.period === period)) continue
    const fee = unitFee(complex, unit)
    const items: InvoiceItem[] = [
      { kind: 'fee', label: `Cuota de administración ${periodLabel(period)}`, amount: fee },
    ]
    // Multas pendientes de la unidad aún no incluidas en otra cuota
    const fines = sanctions.filter(
      (s) => s.type === 'fine' && s.status === 'pending' && !s.invoiceId && s.unitId === unit.id,
    )
    for (const f of fines) {
      items.push({ kind: 'sanction', label: f.title, amount: f.amount ?? 0, sanctionId: f.id })
    }
    const invoice = db.add<Invoice>(db.col(complexId, 'invoices'), {
      unitId: unit.id,
      ...(unit.tower ? { tower: unit.tower } : {}),
      apartmentNumber: unit.number,
      period,
      items,
      total: items.reduce((sum, it) => sum + it.amount, 0),
      status: 'pending',
      dueDate,
    })
    for (const f of fines) db.update(db.col(complexId, 'sanctions'), f.id, { invoiceId: invoice.id })

    // Avisar a propietarios y habitantes de la unidad
    for (const recipientId of [...unit.ownerIds, ...(unit.tenantIds ?? [])]) {
      db.add(db.col(complexId, 'notifications'), {
        recipientId,
        title: '🧾 Cuota de administración disponible',
        body: `${periodLabel(period)} · ${unit.label}: ${fmtCOP(invoice.total)} (vence el ${dayjs(dueDate).format('D [de] MMMM')}).`,
        type: 'billing',
        isRead: false,
      })
    }
    created++
  }
  syncDelinquency(complexId)
  return created
}

/** Marca una cuota como pagada; las multas incluidas quedan pagadas también. */
export function markInvoicePaid(complexId: string, invoice: Invoice, method: PaymentMethod) {
  db.update(db.col(complexId, 'invoices'), invoice.id, {
    status: 'paid',
    paidAt: Date.now(),
    paymentMethod: method,
  })
  for (const item of invoice.items) {
    if (item.sanctionId) db.update(db.col(complexId, 'sanctions'), item.sanctionId, { status: 'paid' })
  }
  syncDelinquency(complexId)
}

/**
 * Mora automática: una unidad queda morosa si tiene alguna cuota vencida sin pagar.
 * Reemplaza el marcado manual de la cartera.
 */
export function syncDelinquency(complexId: string) {
  const invoices = db.list<Invoice>(db.col(complexId, 'invoices'))
  const units = db.list<Unit>(db.col(complexId, 'units'))
  for (const unit of units) {
    const overdue = invoices
      .filter((i) => i.unitId === unit.id && isOverdue(i))
      .sort((a, b) => a.period.localeCompare(b.period))
    const delinquent = overdue.length > 0
    if (delinquent !== (unit.feeStatus === 'delinquent')) {
      db.update(db.col(complexId, 'units'), unit.id, {
        feeStatus: delinquent ? 'delinquent' : 'current',
        ...(delinquent
          ? {
              feePeriod: overdue[0].period,
              feeNotes: `${overdue.length} cuota${overdue.length > 1 ? 's' : ''} vencida${overdue.length > 1 ? 's' : ''} sin pagar`,
            }
          : { feePeriod: undefined, feeNotes: undefined }),
      })
    }
  }
}

// ─── Datos contables del periodo ──────────────────────────────────────────────
export interface PeriodSummary {
  period: string
  /** Recaudado: cuotas del periodo pagadas (incluye multas facturadas). */
  collected: number
  /** Facturado: total de cuotas emitidas del periodo. */
  invoiced: number
  /** % de recaudo. */
  collectionRate: number
  invoiceCount: number
  paidCount: number
  overdueCount: number
  /** Gastos del periodo (pagos a proveedores). */
  expenses: number
  expensesByCategory: { category: string; amount: number }[]
  /** Saldo: recaudado - gastos. */
  balance: number
}

export function summarizePeriod(complexId: string, period: string): PeriodSummary {
  const invoices = db.list<Invoice>(db.col(complexId, 'invoices')).filter((i) => i.period === period)
  const expenses = db
    .list<Expense>(db.col(complexId, 'expenses'))
    .filter((e) => dayjs(e.date).format('YYYY-MM') === period)

  const collected = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.total, 0)
  const invoiced = invoices.reduce((s, i) => s + i.total, 0)
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)

  const byCat = new Map<string, number>()
  for (const e of expenses) byCat.set(e.category, (byCat.get(e.category) ?? 0) + e.amount)

  return {
    period,
    collected,
    invoiced,
    collectionRate: invoiced > 0 ? Math.round((collected / invoiced) * 100) : 0,
    invoiceCount: invoices.length,
    paidCount: invoices.filter((i) => i.status === 'paid').length,
    overdueCount: invoices.filter(isOverdue).length,
    expenses: totalExpenses,
    expensesByCategory: [...byCat.entries()]
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount),
    balance: collected - totalExpenses,
  }
}

// ─── Exportación CSV ──────────────────────────────────────────────────────────
const csvCell = (v: string | number) => {
  const s = String(v)
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** Movimientos del periodo (cuotas + gastos) en CSV para Excel/contador. */
export function buildPeriodCsv(complexId: string, period: string): string {
  const invoices = db.list<Invoice>(db.col(complexId, 'invoices')).filter((i) => i.period === period)
  const expenses = db
    .list<Expense>(db.col(complexId, 'expenses'))
    .filter((e) => dayjs(e.date).format('YYYY-MM') === period)

  const rows: (string | number)[][] = [
    ['Tipo', 'Fecha', 'Concepto', 'Unidad / Proveedor', 'Detalle', 'Valor', 'Estado'],
  ]
  for (const i of invoices) {
    for (const item of i.items) {
      rows.push([
        'Ingreso',
        dayjs(i.paidAt ?? i.dueDate).format('YYYY-MM-DD'),
        item.kind === 'fee' ? 'Cuota administración' : item.kind === 'sanction' ? 'Multa' : 'Cobro adicional',
        `${i.tower ? `${i.tower} ` : ''}${i.apartmentNumber}`,
        item.label,
        item.amount,
        i.status === 'paid' ? 'Pagada' : isOverdue(i) ? 'Vencida' : 'Pendiente',
      ])
    }
  }
  for (const e of expenses) {
    rows.push(['Gasto', dayjs(e.date).format('YYYY-MM-DD'), e.category, e.provider, e.description ?? '', -e.amount, 'Pagado'])
  }
  return rows.map((r) => r.map(csvCell).join(';')).join('\n')
}
