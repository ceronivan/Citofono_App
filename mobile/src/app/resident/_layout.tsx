import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Redirect, Tabs } from 'expo-router'
import React from 'react'
import { useAuth, useRole } from '../../stores/auth'
import { colors } from '../../theme'

export default function ResidentLayout() {
  const user = useAuth((s) => s.user)
  const role = useRole()
  if (!user) return <Redirect href="/login" />
  if (role !== 'resident') return <Redirect href="/" />

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: 'shift',
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.borderLight, height: 64, paddingTop: 6, paddingBottom: 8 },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="home-variant" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="news"
        options={{
          title: 'Noticias',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="newspaper-variant-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Avisos',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="bell-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="reservations"
        options={{
          title: 'Reservas',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="calendar-check-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="account-circle-outline" size={size} color={color} />,
        }}
      />
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
      <Tabs.Screen name="reservation-new" options={{ href: null }} />
      <Tabs.Screen name="content/[col]/[id]" options={{ href: null }} />
    </Tabs>
  )
}
