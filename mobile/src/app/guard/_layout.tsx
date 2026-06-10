import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Redirect, Tabs } from 'expo-router'
import React from 'react'
import { useAuth, useRole } from '../../stores/auth'
import { colors } from '../../theme'

export default function GuardLayout() {
  const user = useAuth((s) => s.user)
  const role = useRole()
  if (!user) return <Redirect href="/login" />
  if (role !== 'guard') return <Redirect href="/" />

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.guard,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.borderLight },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '500' },
      }}
    >
      <Tabs.Screen name="index" options={{
        title: 'Inicio',
        tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="view-dashboard-outline" size={size} color={color} />,
      }} />
      <Tabs.Screen name="visit-new" options={{
        title: 'Visitas',
        tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="walk" size={size} color={color} />,
      }} />
      <Tabs.Screen name="deliveries" options={{
        title: 'Domicilios',
        tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="moped-outline" size={size} color={color} />,
      }} />
      <Tabs.Screen name="mail-new" options={{
        title: 'Correo',
        tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="package-variant-closed" size={size} color={color} />,
      }} />
      <Tabs.Screen name="cameras" options={{
        title: 'Cámaras',
        tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="cctv" size={size} color={color} />,
      }} />
      <Tabs.Screen name="authorizations" options={{ href: null }} />
    </Tabs>
  )
}
