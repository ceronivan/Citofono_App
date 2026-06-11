import { useRouter } from 'expo-router'
import React from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BuildingSwitcher } from '../../components/BuildingSwitcher'
import { Icon } from '../../components/ui'
import { byCreatedDesc, useCollection } from '../../hooks/useCollection'
import { confirmAsk } from '../../stores/confirm'
import { useAuth, useMembership } from '../../stores/auth'
import { colors, shadow } from '../../theme'
import type { AppNotification, Mail, Post } from '../../types'

const MODULES = [
  { title: 'Domicilios', icon: 'moped-outline', href: '/deliveries', bg: '#FEF3C7', color: '#D97706' },
  { title: 'Mis Visitas', icon: 'walk', href: '/visits', bg: '#DBEAFE', color: '#2563EB' },
  { title: 'Autorizaciones', icon: 'shield-check-outline', href: '/authorizations', bg: '#F0FDF4', color: '#15803D' },
  { title: 'Mis Vehículos', icon: 'car-outline', href: '/vehicles', bg: '#FFF7ED', color: '#C2410C' },
  { title: 'Mantenimientos', icon: 'wrench-clock', href: '/maintenance', bg: '#FCE7F3', color: '#DB2777' },
  { title: 'Circulares', icon: 'file-document-outline', href: '/circulars', bg: '#E0E7FF', color: '#4338CA' },
  { title: 'PQRs', icon: 'message-alert-outline', href: '/pqrs', bg: '#FEE2E2', color: '#DC2626' },
  { title: 'Reportar daño', icon: 'wrench-outline', href: '/damage', bg: '#F2F2F7', color: '#52525B' },
  { title: 'Mi correo', icon: 'package-variant-closed', href: '/mail', bg: '#EDE9FF', color: '#7C3AED' },
] as const

export default function ResidentDashboard() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const user = useAuth((s) => s.user)
  const logout = useAuth((s) => s.logout)
  const membership = useMembership()

  const userId = user?.id
  const mail = useCollection<Mail>('mail', (m) => m.residentId === userId && m.status !== 'confirmed')
  const notifs = useCollection<AppNotification>('notifications', (n) => n.recipientId === userId && !n.isRead)
  const news = useCollection<Post>('news', undefined, byCreatedDesc)

  const recentNews = news.filter((n) => n.publishedAt > Date.now() - 7 * 86400_000).length

  const greeting = () => {
    const h = new Date().getHours()
    return h < 12 ? 'Buenos días' : h < 18 ? 'Buenas tardes' : 'Buenas noches'
  }

  async function handleLogout() {
    const ok = await confirmAsk({
      title: '¿Cerrar sesión?',
      message: 'Volverás a la pantalla de inicio de sesión.',
      confirmText: 'Salir',
      danger: false,
    })
    if (ok) {
      await logout()
      router.replace('/login')
    }
  }

  const cards = [
    { label: 'Paquetes', sub: 'en portería', value: mail.length, icon: 'package-variant-closed', bg: '#FEF3C7', color: '#D97706', href: '/mail' },
    { label: 'Avisos', sub: 'sin leer', value: notifs.length, icon: 'bell-outline', bg: '#EDE9FF', color: colors.primary, href: '/resident/notifications' },
    { label: 'Noticias', sub: 'esta semana', value: recentNews, icon: 'newspaper-variant-outline', bg: '#DBEAFE', color: '#2563EB', href: '/resident/news' },
  ] as const

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: 32 }}>
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <View style={s.logoMark}>
          <Icon name="shield-home" size={18} color="#fff" />
        </View>
        <BuildingSwitcher />
        <View style={{ flex: 1 }} />
        <Pressable style={s.logoutBtn} onPress={handleLogout} accessibilityLabel="Cerrar sesión">
          <Icon name="logout-variant" size={19} color={colors.textSecondary} />
        </Pressable>
      </View>

      <View style={s.body}>
        <Text style={s.greeting}>{greeting()},</Text>
        <Text style={s.name}>{user?.firstName ?? 'Residente'}</Text>
        <View style={s.aptPill}>
          <Icon name="door" size={13} color={colors.primary} />
          <Text style={s.aptPillText}>Apto {membership?.apartmentNumber ?? '—'}</Text>
        </View>

        <View style={s.summaryRow}>
          {cards.map((c) => (
            <Pressable
              key={c.label}
              style={({ pressed }) => [s.summaryCard, pressed && s.pressed]}
              onPress={() => router.push(c.href as never)}
            >
              <View style={[s.summaryIcon, { backgroundColor: c.bg }]}>
                <Icon name={c.icon} size={18} color={c.color} />
              </View>
              <Text style={[s.summaryValue, c.value > 0 && { color: c.color }]}>{c.value}</Text>
              <Text style={s.summaryLabel}>{c.label}</Text>
              <Text style={s.summarySub}>{c.sub}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={s.sectionTitle}>MÁS SERVICIOS</Text>
        <View style={s.grid}>
          {MODULES.map((m) => (
            <Pressable
              key={m.href}
              style={({ pressed }) => [s.module, pressed && s.pressed]}
              onPress={() => router.push(m.href as never)}
              accessibilityRole="button"
              accessibilityLabel={m.title}
            >
              <View style={[s.moduleIcon, { backgroundColor: m.bg }]}>
                <Icon name={m.icon} size={24} color={m.color} />
              </View>
              <Text style={s.moduleLabel} numberOfLines={2}>{m.title}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 20, paddingBottom: 8,
  },
  logoMark: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  logoutBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.surface2,
    alignItems: 'center', justifyContent: 'center',
  },
  body: { paddingHorizontal: 20 },

  greeting: { fontSize: 15, color: colors.textSecondary, fontWeight: '500', marginTop: 10 },
  name: { fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -0.7 },
  aptPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.primarySoft, alignSelf: 'flex-start',
    borderRadius: 9999, paddingHorizontal: 12, paddingVertical: 4,
    marginTop: 8, marginBottom: 20,
  },
  aptPillText: { fontSize: 13, fontWeight: '600', color: colors.primary },

  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  summaryCard: {
    flex: 1, backgroundColor: colors.surface, borderRadius: 18,
    padding: 13, gap: 5, ...shadow.xs,
  },
  summaryIcon: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  summaryValue: { fontSize: 24, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  summaryLabel: { fontSize: 13.5, fontWeight: '600', color: colors.text },
  summarySub: { fontSize: 12, color: colors.textSecondary },

  sectionTitle: {
    fontSize: 13, fontWeight: '700', color: colors.textTertiary,
    letterSpacing: 0.6, marginBottom: 12,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  module: {
    flexBasis: '30%', flexGrow: 1, maxWidth: '32%',
    alignItems: 'center', gap: 8,
    backgroundColor: colors.surface, borderRadius: 18,
    paddingVertical: 16, paddingHorizontal: 6, minHeight: 106,
    ...shadow.xs,
  },
  moduleIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  moduleLabel: { fontSize: 13, fontWeight: '600', color: colors.text, textAlign: 'center', lineHeight: 17 },

  pressed: { transform: [{ scale: 0.96 }] },
})
