import { useRouter } from 'expo-router'
import React, { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Icon, ListRow, Screen } from '../../components/ui'
import * as db from '../../data/db'
import { useDataVersion } from '../../data/version'
import { useCollection } from '../../hooks/useCollection'
import { useComplexId } from '../../stores/auth'
import { colors, shadow } from '../../theme'
import type { Complex, Unit } from '../../types'

export default function BuildingHub() {
  const router = useRouter()
  const complexId = useComplexId()
  const version = useDataVersion((s) => s.version)
  const complex = useMemo(
    () => (complexId ? db.find<Complex & { id: string }>('complexes', complexId) : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [complexId, version],
  )
  const units = useCollection<Unit>('units')
  const delinquent = units.filter((u) => u.feeStatus === 'delinquent').length
  const occupied = units.filter((u) => u.ownerIds.length > 0).length

  const sections = [
    { title: 'Unidades y cartera', sub: `${units.length} aptos · ${delinquent} en mora`, icon: 'door', color: '#0EA5E9', bg: '#E0F2FE', href: '/admin/units' },
    { title: 'Amenidades', sub: `${(complex?.amenities ?? []).filter((a) => a.active).length} zonas comunes`, icon: 'pool', color: '#16A34A', bg: '#DCFCE7', href: '/admin/amenities' },
    { title: 'Invitaciones', sub: 'Códigos para nuevos residentes', icon: 'ticket-confirmation-outline', color: '#7C3AED', bg: '#EDE9FF', href: '/admin/invites' },
    { title: 'Cámaras de seguridad', sub: 'CCTV del edificio', icon: 'cctv', color: '#DC2626', bg: '#FEE2E2', href: '/admin/cameras' },
    { title: 'Mantenimientos', sub: 'Ascensor, piscina y más', icon: 'wrench-clock', color: '#D97706', bg: '#FEF3C7', href: '/admin/maintenance' },
    { title: 'Registro de ingresos', sub: 'Visitas por apartamento', icon: 'clipboard-text-clock-outline', color: '#4338CA', bg: '#E0E7FF', href: '/admin/entry-log' },
  ] as const

  return (
    <Screen title="Mi Edificio" showBack={false}>
      <View style={s.card}>
        <View style={s.avatar}>
          <Icon name="office-building" size={26} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.name}>{complex?.name ?? '…'}</Text>
          <Text style={s.address}>{complex?.address}{complex?.city ? `, ${complex.city}` : ''}</Text>
          <View style={s.stats}>
            <Text style={s.stat}><Text style={s.statStrong}>{complex?.towers.length ?? 0}</Text> torres</Text>
            <Text style={s.stat}><Text style={s.statStrong}>{units.length}</Text> aptos</Text>
            <Text style={s.stat}><Text style={s.statStrong}>{occupied}</Text> ocupados</Text>
          </View>
        </View>
      </View>

      <View style={{ gap: 8 }}>
        {sections.map((item) => (
          <ListRow
            key={item.href}
            icon={item.icon}
            iconBg={item.bg}
            iconColor={item.color}
            title={item.title}
            subtitle={item.sub}
            right={<Icon name="chevron-right" size={18} color={colors.textTertiary} />}
            onPress={() => router.push(item.href as never)}
          />
        ))}
      </View>
    </Screen>
  )
}

const s = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: colors.surface, borderRadius: 20, padding: 18,
    marginBottom: 16, ...shadow.sm,
  },
  avatar: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: colors.admin,
    alignItems: 'center', justifyContent: 'center',
  },
  name: { fontSize: 17, fontWeight: '800', letterSpacing: -0.4, color: colors.text },
  address: { fontSize: 13.5, color: colors.textSecondary, marginTop: 2, marginBottom: 8 },
  stats: { flexDirection: 'row', gap: 12 },
  stat: { fontSize: 13, color: colors.textSecondary },
  statStrong: { color: colors.text, fontWeight: '700' },
})
