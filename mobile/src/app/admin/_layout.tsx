import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Redirect, Tabs } from 'expo-router'
import React from 'react'
import { useAuth, useRole } from '../../stores/auth'
import { colors } from '../../theme'

export default function AdminLayout() {
  const user = useAuth((s) => s.user)
  const role = useRole()
  if (!user) return <Redirect href="/login" />
  if (role !== 'admin') return <Redirect href="/" />

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: 'shift',
        tabBarActiveTintColor: colors.admin,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.borderLight, height: 64, paddingTop: 6, paddingBottom: 8 },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="index" options={{
        title: 'Inicio',
        tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="view-dashboard-outline" size={size} color={color} />,
      }} />
      <Tabs.Screen name="building" options={{
        title: 'Edificio',
        tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="office-building-outline" size={size} color={color} />,
      }} />
      <Tabs.Screen name="reservations" options={{
        title: 'Reservas',
        tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="calendar-check-outline" size={size} color={color} />,
      }} />
      <Tabs.Screen name="pqrs" options={{
        title: 'PQRs',
        tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="message-alert-outline" size={size} color={color} />,
      }} />
      <Tabs.Screen name="news" options={{
        title: 'Publicar',
        tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="newspaper-variant-outline" size={size} color={color} />,
      }} />
      {/* Pantallas sin tab */}
      <Tabs.Screen name="units" options={{ href: null }} />
      <Tabs.Screen name="amenities" options={{ href: null }} />
      <Tabs.Screen name="invites" options={{ href: null }} />
      <Tabs.Screen name="cameras" options={{ href: null }} />
      <Tabs.Screen name="maintenance" options={{ href: null }} />
      <Tabs.Screen name="entry-log" options={{ href: null }} />
      <Tabs.Screen name="damage" options={{ href: null }} />
    </Tabs>
  )
}
