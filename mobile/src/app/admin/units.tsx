import React, { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { BottomSheet, Btn, Input, Screen, StatusChip } from '../../components/ui'
import * as db from '../../data/db'
import { useCollection } from '../../hooks/useCollection'
import { useComplexId } from '../../stores/auth'
import { colors, shadow } from '../../theme'
import type { Unit } from '../../types'

export default function Units() {
  const complexId = useComplexId()
  const units = useCollection<Unit>('units', undefined, (a, b) => a.label.localeCompare(b.label))
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'delinquent' | 'current'>('all')
  const [selected, setSelected] = useState<Unit | null>(null)

  const delinquentCount = units.filter((u) => u.feeStatus === 'delinquent').length
  const filtered = units.filter((u) => {
    if (filter !== 'all' && u.feeStatus !== filter) return false
    const q = search.trim().toLowerCase()
    if (!q) return true
    return u.number.includes(q) || u.label.toLowerCase().includes(q) ||
      (u.ownerNames ?? []).some((n) => n.toLowerCase().includes(q))
  })

  const period = (() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })()

  function setStatus(status: 'current' | 'delinquent') {
    if (!complexId || !selected) return
    db.update(db.col(complexId, 'units'), selected.id, { feeStatus: status, feePeriod: period })
    setSelected(null)
  }

  return (
    <Screen title="Unidades y cartera">
      <View style={s.summary}>
        <View style={s.summaryCard}><Text style={s.summaryValue}>{units.length}</Text><Text style={s.summaryLabel}>Apartamentos</Text></View>
        <View style={s.summaryCard}><Text style={[s.summaryValue, { color: colors.error }]}>{delinquentCount}</Text><Text style={s.summaryLabel}>En mora</Text></View>
        <View style={s.summaryCard}><Text style={[s.summaryValue, { color: colors.success }]}>{units.length - delinquentCount}</Text><Text style={s.summaryLabel}>Al día</Text></View>
      </View>

      <Input placeholder="Buscar apto o propietario…" value={search} onChangeText={setSearch} />

      <View style={s.filters}>
        {([['all', 'Todos'], ['delinquent', 'En mora'], ['current', 'Al día']] as const).map(([key, label]) => (
          <Pressable
            key={key}
            style={[s.filterChip, filter === key && s.filterChipOn]}
            onPress={() => setFilter(key)}
          >
            <Text style={[s.filterChipText, filter === key && { color: '#fff' }]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={s.grid}>
        {filtered.map((u) => (
          <Pressable
            key={u.id}
            style={[s.cell, u.feeStatus === 'delinquent' && s.cellDelinquent, !u.ownerIds.length && { opacity: 0.65 }]}
            onPress={() => setSelected(u)}
          >
            <Text style={s.cellNumber}>{u.label}</Text>
            <Text style={s.cellOwner} numberOfLines={1}>{u.ownerNames?.[0] ?? 'Sin registrar'}</Text>
            <View style={[s.dot, { backgroundColor: u.feeStatus === 'delinquent' ? colors.error : colors.success }]} />
          </Pressable>
        ))}
      </View>

      <BottomSheet visible={!!selected} onClose={() => setSelected(null)} title={selected?.label ?? ''}>
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 13.5, color: colors.textSecondary }}>
              {selected?.ownerNames?.length ? selected.ownerNames.join(', ') : 'Sin propietario registrado'}
            </Text>
            {selected && <StatusChip status={selected.feeStatus} />}
          </View>
          <Text style={{ fontSize: 12, color: colors.textTertiary }}>
            Estado de la cuota de administración — periodo {period}
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Btn variant="success" icon="check-circle-outline" style={{ flex: 1 }} onPress={() => setStatus('current')}>Al día</Btn>
            <Btn variant="danger" icon="alert-circle-outline" style={{ flex: 1 }} onPress={() => setStatus('delinquent')}>En mora</Btn>
          </View>
          <Text style={{ fontSize: 12, color: colors.textTertiary, lineHeight: 17 }}>
            Los aptos en mora no podrán reservar amenidades configuradas con bloqueo.
          </Text>
        </View>
      </BottomSheet>
    </Screen>
  )
}

const s = StyleSheet.create({
  summary: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  summaryCard: {
    flex: 1, alignItems: 'center', gap: 2,
    backgroundColor: colors.surface, borderRadius: 16, paddingVertical: 14, ...shadow.xs,
  },
  summaryValue: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5, color: colors.text },
  summaryLabel: { fontSize: 11, color: colors.textSecondary },

  filters: { flexDirection: 'row', gap: 8, marginVertical: 12 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 9999, backgroundColor: colors.surface, ...shadow.xs,
  },
  filterChipOn: { backgroundColor: colors.text },
  filterChipText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cell: {
    width: '31%', flexGrow: 1,
    backgroundColor: colors.surface, borderRadius: 14, padding: 12,
    borderWidth: 1.5, borderColor: 'transparent', ...shadow.xs,
  },
  cellDelinquent: { borderColor: colors.errorSoft, backgroundColor: '#FFFBFB' },
  cellNumber: { fontSize: 13, fontWeight: '800', color: colors.text },
  cellOwner: { fontSize: 10.5, color: colors.textSecondary, marginTop: 2 },
  dot: { position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: 4 },
})
