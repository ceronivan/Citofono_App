/**
 * Tab bar flotante — paridad con el bottom-nav de la versión Vue:
 * píldora blanca elevada del borde (safe area), sombra suave y
 * tinte del rol detrás del ícono activo.
 */
import { MaterialCommunityIcons } from '@expo/vector-icons'
import React from 'react'
import { View, type ColorValue } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, weight } from '../theme'

type Role = 'resident' | 'admin' | 'guard'

/** Tinte del ícono activo: color del rol al 8% (igual que .nav-item--active de Vue). */
const ROLE_TINT: Record<Role, string> = {
  resident: 'rgba(79, 53, 232, 0.08)',
  admin: 'rgba(14, 165, 233, 0.08)',
  guard: 'rgba(16, 185, 129, 0.08)',
}

type IconName = keyof typeof MaterialCommunityIcons.glyphMap

export function TabIcon({
  name,
  color,
  focused,
  tint,
}: {
  name: string
  color: ColorValue
  focused: boolean
  tint: string
}) {
  return (
    <View
      style={{
        width: 38,
        height: 30,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: focused ? tint : 'transparent',
      }}
    >
      <MaterialCommunityIcons name={name as IconName} size={22} color={color} />
    </View>
  )
}

/** Fábrica de tabBarIcon para un rol: `tabBarIcon: tabIcon('home-variant', 'resident')`. */
export const tabIcon =
  (name: string, role: Role) =>
  ({ color, focused }: { color: ColorValue; focused: boolean }) => (
    <TabIcon name={name} color={color} focused={focused} tint={ROLE_TINT[role]} />
  )

export function useFloatingTabOptions(role: Role) {
  const insets = useSafeAreaInsets()
  return {
    headerShown: false,
    tabBarActiveTintColor: colors[role],
    tabBarInactiveTintColor: colors.textTertiary,
    tabBarStyle: {
      position: 'absolute' as const,
      left: 16,
      right: 16,
      bottom: Math.max(insets.bottom, 16),
      height: 64,
      borderRadius: 26,
      borderTopWidth: 0,
      backgroundColor: colors.surface,
      paddingTop: 6,
      paddingBottom: 6,
      boxShadow: '0 4px 24px rgba(0, 0, 0, 0.09), 0 0 0 1px rgba(0, 0, 0, 0.04)',
      elevation: 10,
    },
    tabBarItemStyle: { gap: 2 },
    tabBarLabelStyle: { fontSize: 12, ...weight.semibold },
  }
}
