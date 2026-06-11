import { Redirect, Tabs } from 'expo-router'
import React from 'react'
import { tabIcon, useFloatingTabOptions } from '../../components/tabBar'
import { useAuth, useRole } from '../../stores/auth'

export default function AdminLayout() {
  const user = useAuth((s) => s.user)
  const role = useRole()
  const tabOptions = useFloatingTabOptions('admin')
  if (!user) return <Redirect href="/login" />
  if (role !== 'admin') return <Redirect href="/" />

  return (
    <Tabs safeAreaInsets={{ bottom: 0 }} screenOptions={{ ...tabOptions, animation: 'shift' }}>
      <Tabs.Screen name="index" options={{ title: 'Inicio', tabBarIcon: tabIcon('view-dashboard-outline', 'admin') }} />
      <Tabs.Screen name="building" options={{ title: 'Edificio', tabBarIcon: tabIcon('office-building-outline', 'admin') }} />
      <Tabs.Screen name="reservations" options={{ title: 'Reservas', tabBarIcon: tabIcon('calendar-check-outline', 'admin') }} />
      <Tabs.Screen name="pqrs" options={{ title: 'PQRs', tabBarIcon: tabIcon('message-alert-outline', 'admin') }} />
      <Tabs.Screen name="news" options={{ title: 'Publicar', tabBarIcon: tabIcon('newspaper-variant-outline', 'admin') }} />
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
