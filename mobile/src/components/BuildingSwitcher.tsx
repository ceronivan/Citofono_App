import { useRouter } from 'expo-router'
import React, { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { DASHBOARD, useAuth, useMembership } from '../stores/auth'
import { colors, ROLE_META, weight } from '../theme'
import { BottomSheet, Icon } from './ui'

/** Selector de edificio estilo Slack — pill en el header de los 3 roles. */
export function BuildingSwitcher() {
  const router = useRouter()
  const user = useAuth((s) => s.user)
  const setActiveComplex = useAuth((s) => s.setActiveComplex)
  const membership = useMembership()
  const [open, setOpen] = useState(false)

  const memberships = user?.memberships ?? []
  const hasAdmin = memberships.some((m) => m.role === 'admin')
  const showSwitcher = memberships.length > 1 || hasAdmin

  function select(complexId: string) {
    setOpen(false)
    if (complexId === membership?.complexId) return
    const target = memberships.find((m) => m.complexId === complexId)
    setActiveComplex(complexId)
    router.replace(DASHBOARD[target?.role ?? 'resident'] as never)
  }

  return (
    <>
      <Pressable
        style={({ pressed }) => [s.pill, pressed && showSwitcher && s.pressed]}
        onPress={() => showSwitcher && setOpen(true)}
      >
        <View style={s.pillIcon}>
          <Icon name="office-building-outline" size={14} color={colors.primary} />
        </View>
        <Text style={s.pillName} numberOfLines={1}>
          {membership?.complexName ?? 'Mi edificio'}
        </Text>
        {showSwitcher && <Icon name="unfold-more-horizontal" size={14} color={colors.textTertiary} />}
      </Pressable>

      <BottomSheet visible={open} onClose={() => setOpen(false)} title="Mis edificios">
        <Text style={s.sub}>Cambia entre los edificios a los que perteneces</Text>
        {memberships.map((m) => {
          const meta = ROLE_META[m.role]
          const active = m.complexId === membership?.complexId
          return (
            <Pressable
              key={m.complexId}
              style={({ pressed }) => [s.item, active && s.itemActive, pressed && s.pressed]}
              onPress={() => select(m.complexId)}
            >
              <View style={[s.itemAvatar, { backgroundColor: meta.color + '18' }]}>
                <Icon name="office-building" size={20} color={meta.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.itemName}>{m.complexName}</Text>
                <Text style={s.itemMeta}>
                  {meta.label}
                  {m.apartmentNumber ? ` · Apto ${m.apartmentNumber}` : ''}
                </Text>
              </View>
              {active && <Icon name="check-circle" size={20} color={meta.color} />}
            </Pressable>
          )
        })}
        {hasAdmin && (
          <Pressable
            style={({ pressed }) => [s.create, pressed && s.pressed]}
            onPress={() => { setOpen(false); router.push('/setup-building' as never) }}
          >
            <View style={s.createIcon}>
              <Icon name="plus" size={18} color={colors.primary} />
            </View>
            <Text style={s.createText}>Crear edificio nuevo</Text>
          </Pressable>
        )}
      </BottomSheet>
    </>
  )
}

const s = StyleSheet.create({
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.borderLight,
    borderRadius: 9999, paddingVertical: 5, paddingHorizontal: 10,
    maxWidth: 200,
  },
  pillIcon: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  pillName: { fontSize: 14, ...weight.bold, color: colors.text, flexShrink: 1 },
  pressed: { transform: [{ scale: 0.96 }] },

  sub: { ...weight.regular, fontSize: 14, color: colors.textSecondary, marginBottom: 14, marginTop: -6 },

  item: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, borderRadius: 16, marginBottom: 8,
    backgroundColor: colors.bg,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  itemActive: { borderColor: colors.primary, backgroundColor: colors.surface },
  itemAvatar: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  itemName: { fontSize: 14, ...weight.bold, color: colors.text },
  itemMeta: { ...weight.regular, fontSize: 12.5, color: colors.textSecondary, marginTop: 1 },

  create: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, borderRadius: 16, marginTop: 4,
    borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.border,
  },
  createIcon: {
    width: 42, height: 42, borderRadius: 13,
    backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  createText: { fontSize: 14, ...weight.semibold, color: colors.primary },
})
