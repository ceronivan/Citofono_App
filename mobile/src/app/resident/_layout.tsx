import { Redirect, Tabs } from 'expo-router'
import React from 'react'
import { tabIcon, useFloatingTabOptions } from '../../components/tabBar'
import { isInhabitant, useAuth, useResidentType, useRole } from '../../stores/auth'

export default function ResidentLayout() {
  const user = useAuth((s) => s.user)
  const role = useRole()
  const residentType = useResidentType()
  const tabOptions = useFloatingTabOptions('resident')
  if (!user) return <Redirect href="/login" />
  if (role !== 'resident') return <Redirect href="/" />
  // El propietario que no habita la unidad no reserva zonas comunes
  const canReserve = isInhabitant(residentType)

  return (
    <Tabs safeAreaInsets={{ bottom: 0 }} screenOptions={{ ...tabOptions, animation: 'shift' }}>
      <Tabs.Screen name="index" options={{ title: 'Inicio', tabBarIcon: tabIcon('home-variant', 'resident') }} />
      <Tabs.Screen name="news" options={{ title: 'Noticias', tabBarIcon: tabIcon('newspaper-variant-outline', 'resident') }} />
      <Tabs.Screen name="notifications" options={{ title: 'Avisos', tabBarIcon: tabIcon('bell-outline', 'resident') }} />
      <Tabs.Screen
        name="reservations"
        options={{
          title: 'Reservas',
          tabBarIcon: tabIcon('calendar-check-outline', 'resident'),
          ...(canReserve ? {} : { href: null }),
        }}
      />
      <Tabs.Screen name="profile" options={{ title: 'Perfil', tabBarIcon: tabIcon('account-circle-outline', 'resident') }} />
      {/* Pantallas sin tab propia — el menú inferior permanece visible */}
      <Tabs.Screen name="deliveries" options={{ href: null }} />
      <Tabs.Screen name="visits" options={{ href: null }} />
      <Tabs.Screen name="vehicles" options={{ href: null }} />
      <Tabs.Screen name="authorizations" options={{ href: null }} />
      <Tabs.Screen name="mail" options={{ href: null }} />
      <Tabs.Screen name="circulars" options={{ href: null }} />
      <Tabs.Screen name="pqrs" options={{ href: null }} />
      <Tabs.Screen name="damage" options={{ href: null }} />
      <Tabs.Screen name="maintenance" options={{ href: null }} />
      <Tabs.Screen name="sanctions" options={{ href: null }} />
      <Tabs.Screen name="reservation-new" options={{ href: null }} />
      <Tabs.Screen name="content/[col]/[id]" options={{ href: null }} />
    </Tabs>
  )
}
