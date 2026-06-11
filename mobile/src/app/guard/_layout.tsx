import { Redirect, Tabs } from 'expo-router'
import React from 'react'
import { tabIcon, useFloatingTabOptions } from '../../components/tabBar'
import { useAuth, useRole } from '../../stores/auth'

export default function GuardLayout() {
  const user = useAuth((s) => s.user)
  const role = useRole()
  const tabOptions = useFloatingTabOptions('guard')
  if (!user) return <Redirect href="/login" />
  if (role !== 'guard') return <Redirect href="/" />

  return (
    <Tabs safeAreaInsets={{ bottom: 0 }} screenOptions={{ ...tabOptions, animation: 'shift' }}>
      <Tabs.Screen name="index" options={{ title: 'Inicio', tabBarIcon: tabIcon('view-dashboard-outline', 'guard') }} />
      <Tabs.Screen name="visit-new" options={{ title: 'Visitas', tabBarIcon: tabIcon('walk', 'guard') }} />
      <Tabs.Screen name="deliveries" options={{ title: 'Domicilios', tabBarIcon: tabIcon('moped-outline', 'guard') }} />
      <Tabs.Screen name="mail-new" options={{ title: 'Correo', tabBarIcon: tabIcon('package-variant-closed', 'guard') }} />
      <Tabs.Screen name="cameras" options={{ title: 'Cámaras', tabBarIcon: tabIcon('cctv', 'guard') }} />
      <Tabs.Screen name="authorizations" options={{ href: null }} />
    </Tabs>
  )
}
