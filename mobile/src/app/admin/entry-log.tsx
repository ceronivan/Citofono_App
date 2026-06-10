import dayjs from 'dayjs'
import React, { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { EmptyState, Icon, Input, Screen } from '../../components/ui'
import { useCollection } from '../../hooks/useCollection'
import { colors, shadow } from '../../theme'
import type { Visit } from '../../types'

const RANGES = [
  { value: 'today', label: 'Hoy', ms: 0 },
  { value: 'week', label: '7 días', ms: 7 * 86400_000 },
  { value: 'month', label: '30 días', ms: 30 * 86400_000 },
  { value: 'all', label: 'Todo', ms: Infinity },
] as const

export default function EntryLog() {
  const visits = useCollection<Visit>('visits', undefined, (a, b) => b.entryTime - a.entryTime)
  const [range, setRange] = useState<'today' | 'week' | 'month' | 'all'>('week')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const r = RANGES.find((x) => x.value === range)!
    const cutoff = range === 'today' ? dayjs().startOf('day').valueOf() : Date.now() - r.ms
    let list = visits.filter((v) => range === 'all' || v.entryTime >= cutoff)
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter((v) =>
        v.apartmentNumber.toLowerCase().includes(q) ||
        (v.visitorName ?? '').toLowerCase().includes(q) ||
        (v.driverName ?? '').toLowerCase().includes(q) ||
        (v.vehiclePlate ?? '').toLowerCase().includes(q),
      )
    }
    return list
  }, [visits, range, search])

  const byApt = useMemo(() => {
    const map = new Map<string, Visit[]>()
    for (const v of filtered) {
      if (!map.has(v.apartmentNumber)) map.set(v.apartmentNumber, [])
      map.get(v.apartmentNumber)!.push(v)
    }
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length)
  }, [filtered])

  const inside = filtered.filter((v) => !v.exitTime).length
  const max = byApt[0]?.[1].length ?? 1

  return (
    <Screen title="Registro de ingresos">
      <View style={s.stats}>
        <View style={s.stat}><Text style={s.statValue}>{filtered.length}</Text><Text style={s.statLabel}>Ingresos</Text></View>
        <View style={s.stat}><Text style={s.statValue}>{byApt.length}</Text><Text style={s.statLabel}>Aptos visitados</Text></View>
        <View style={s.stat}><Text style={[s.statValue, { color: colors.guard }]}>{inside}</Text><Text style={s.statLabel}>Dentro ahora</Text></View>
      </View>

      <View style={s.ranges}>
        {RANGES.map((r) => (
          <Pressable key={r.value} style={[s.range, range === r.value && s.rangeOn]} onPress={() => setRange(r.value)}>
            <Text style={[s.rangeText, range === r.value && { color: '#fff' }]}>{r.label}</Text>
          </Pressable>
        ))}
      </View>

      <Input placeholder="Buscar apto, visitante o placa…" value={search} onChangeText={setSearch} />

      {byApt.length === 0 ? (
        <EmptyState icon="clipboard-text-clock-outline" message="No hay ingresos en este periodo" />
      ) : (
        <View style={{ gap: 8, marginTop: 14 }}>
          {byApt.map(([apt, list]) => (
            <View key={apt} style={s.aptCard}>
              <Pressable style={s.aptHead} onPress={() => setExpanded(expanded === apt ? null : apt)}>
                <View style={s.aptNumber}><Text style={s.aptNumberText}>{apt}</Text></View>
                <View style={{ width: 120 }}>
                  <Text style={s.aptCount}>{list.length} ingreso{list.length === 1 ? '' : 's'}</Text>
                  <Text style={s.aptLast}>Último: {dayjs(list[0].entryTime).format('D MMM · h:mm a')}</Text>
                </View>
                <View style={s.barWrap}>
                  <View style={[s.bar, { width: `${Math.min(100, (list.length / max) * 100)}%` }]} />
                </View>
                <Icon name={expanded === apt ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textTertiary} />
              </Pressable>
              {expanded === apt && (
                <View style={s.detail}>
                  {list.map((v) => (
                    <View key={v.id} style={s.visit}>
                      <Icon name={v.type === 'vehicle' ? 'car-outline' : 'walk'} size={16} color={colors.textSecondary} />
                      <View style={{ flex: 1 }}>
                        <Text style={s.visitName}>
                          {v.visitorName ?? v.driverName ?? 'Visitante'}{v.vehiclePlate ? ` · ${v.vehiclePlate}` : ''}
                        </Text>
                        <Text style={s.visitTime}>
                          {dayjs(v.entryTime).format('D MMM · h:mm a')}
                          {v.exitTime ? ` → ${dayjs(v.exitTime).format('h:mm a')} (${v.duration} min)` : ' · Dentro'}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      )}
    </Screen>
  )
}

const s = StyleSheet.create({
  stats: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  stat: { flex: 1, alignItems: 'center', gap: 2, backgroundColor: colors.surface, borderRadius: 16, paddingVertical: 14, ...shadow.xs },
  statValue: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5, color: colors.text },
  statLabel: { fontSize: 11, color: colors.textSecondary },

  ranges: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  range: { flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: colors.surface, alignItems: 'center', ...shadow.xs },
  rangeOn: { backgroundColor: colors.text },
  rangeText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },

  aptCard: { backgroundColor: colors.surface, borderRadius: 16, overflow: 'hidden', ...shadow.xs },
  aptHead: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13 },
  aptNumber: { minWidth: 48, backgroundColor: 'rgba(14,165,233,0.1)', borderRadius: 10, paddingVertical: 7, alignItems: 'center' },
  aptNumberText: { fontSize: 15, fontWeight: '800', color: colors.admin },
  aptCount: { fontSize: 13, fontWeight: '700', color: colors.text },
  aptLast: { fontSize: 10.5, color: colors.textTertiary },
  barWrap: { flex: 1, height: 6, backgroundColor: colors.surface2, borderRadius: 3, overflow: 'hidden' },
  bar: { height: '100%', backgroundColor: colors.admin, borderRadius: 3 },

  detail: { paddingHorizontal: 13, paddingBottom: 12, gap: 8 },
  visit: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    backgroundColor: colors.bg, borderRadius: 10, padding: 10,
  },
  visitName: { fontSize: 12.5, fontWeight: '600', color: colors.text },
  visitTime: { fontSize: 11, color: colors.textSecondary },
})
