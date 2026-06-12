import { useRouter } from 'expo-router'
import React from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BuildingSwitcher } from '../../components/BuildingSwitcher'
import { Icon, ScalePressable } from '../../components/ui'
import { byCreatedDesc, useCollection } from '../../hooks/useCollection'
import { confirmAsk } from '../../stores/confirm'
import {
  RESIDENT_TYPE_META,
  isInhabitant,
  isOwner,
  useAuth,
  useMembership,
  useResidentType,
} from '../../stores/auth'
import { colors, shadow, weight } from '../../theme'
import type { AppNotification, Mail, Post, Sanction } from '../../types'

/** `who`: quién ve el módulo — all | inhabitant (vive en la unidad) | owner (dueño). */
const MODULES = [
  { title: 'Domicilios', icon: 'moped-outline', href: '/resident/deliveries', bg: '#FEF3C7', color: '#D97706', who: 'inhabitant' },
  { title: 'Mis Visitas', icon: 'walk', href: '/resident/visits', bg: '#DBEAFE', color: '#2563EB', who: 'inhabitant' },
  { title: 'Autorizaciones', icon: 'shield-check-outline', href: '/resident/authorizations', bg: '#F0FDF4', color: '#15803D', who: 'inhabitant' },
  { title: 'Vehículos', icon: 'car-outline', href: '/resident/vehicles', bg: '#FFF7ED', color: '#C2410C', who: 'owner' },
  { title: 'Multas y llamados', icon: 'gavel', href: '/resident/sanctions', bg: '#FEF9C3', color: '#A16207', who: 'all' },
  { title: 'Mantenimientos', icon: 'wrench-clock', href: '/resident/maintenance', bg: '#FCE7F3', color: '#DB2777', who: 'all' },
  { title: 'Circulares', icon: 'file-document-outline', href: '/resident/circulars', bg: '#E0E7FF', color: '#4338CA', who: 'all' },
  { title: 'PQRs', icon: 'message-alert-outline', href: '/resident/pqrs', bg: '#FEE2E2', color: '#DC2626', who: 'all' },
  { title: 'Reportar daño', icon: 'wrench-outline', href: '/resident/damage', bg: '#F2F2F7', color: '#52525B', who: 'all' },
  { title: 'Mi correo', icon: 'package-variant-closed', href: '/resident/mail', bg: '#EDE9FF', color: '#7C3AED', who: 'inhabitant' },
] as const

export default function ResidentDashboard() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const user = useAuth((s) => s.user)
  const logout = useAuth((s) => s.logout)
  const membership = useMembership()
  const residentType = useResidentType()

  const userId = user?.id
  const mail = useCollection<Mail>('mail', (m) => m.residentId === userId && m.status !== 'confirmed')
  const notifs = useCollection<AppNotification>('notifications', (n) => n.recipientId === userId && !n.isRead)
  const news = useCollection<Post>('news', undefined, byCreatedDesc)
  const pendingFines = useCollection<Sanction>(
    'sanctions',
    (x) =>
      x.apartmentNumber === membership?.apartmentNumber &&
      (!x.tower || x.tower === membership?.tower) &&
      x.type === 'fine' && x.status === 'pending',
  )

  const recentNews = news.filter((n) => n.publishedAt > Date.now() - 7 * 86400_000).length
  const typeMeta = residentType ? RESIDENT_TYPE_META[residentType] : null
  const visibleModules = MODULES.filter(
    (m) =>
      m.who === 'all' ||
      (m.who === 'inhabitant' && isInhabitant(residentType)) ||
      (m.who === 'owner' && isOwner(residentType)),
  )

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
    // El propietario que no habita no recibe paquetes: ve las multas pendientes de su unidad
    residentType === 'owner'
      ? { label: 'Multas', sub: 'pendientes', value: pendingFines.length, icon: 'gavel', bg: '#FEF9C3', color: '#A16207', href: '/resident/sanctions' }
      : { label: 'Paquetes', sub: 'en portería', value: mail.length, icon: 'package-variant-closed', bg: '#FEF3C7', color: '#D97706', href: '/resident/mail' },
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
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 8, marginBottom: 20 }}>
          <View style={s.aptPill}>
            <Icon name="door" size={13} color={colors.primary} />
            <Text style={s.aptPillText}>
              {membership?.tower ? `${membership.tower} · ` : ''}Apto {membership?.apartmentNumber ?? '—'}
            </Text>
          </View>
          {typeMeta && (
            <View style={[s.aptPill, { backgroundColor: '#FEF9C3' }]}>
              <Icon name={typeMeta.icon} size={13} color="#A16207" />
              <Text style={[s.aptPillText, { color: '#A16207' }]}>{typeMeta.label}</Text>
            </View>
          )}
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
          {visibleModules.map((m) => (
            <View key={m.href} style={s.moduleCell}>
              <ScalePressable
                style={s.module}
                scaleTo={0.94}
                onPress={() => router.push(m.href as never)}
                accessibilityRole="button"
                accessibilityLabel={m.title}
              >
                <View style={[s.moduleIcon, { backgroundColor: m.bg }]}>
                  <Icon name={m.icon} size={24} color={m.color} />
                </View>
                <Text style={s.moduleLabel} numberOfLines={2}>{m.title}</Text>
              </ScalePressable>
            </View>
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

  greeting: { fontSize: 15, color: colors.textSecondary, ...weight.medium, marginTop: 10 },
  name: { fontSize: 28, ...weight.extrabold, color: colors.text, letterSpacing: -0.7 },
  aptPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.primarySoft, alignSelf: 'flex-start',
    borderRadius: 9999, paddingHorizontal: 12, paddingVertical: 4,
  },
  aptPillText: { fontSize: 13, ...weight.semibold, color: colors.primary },

  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  summaryCard: {
    flex: 1, backgroundColor: colors.surface, borderRadius: 18,
    padding: 13, gap: 5, ...shadow.xs,
  },
  summaryIcon: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  summaryValue: { fontSize: 24, ...weight.extrabold, color: colors.text, letterSpacing: -0.5 },
  summaryLabel: { fontSize: 13.5, ...weight.semibold, color: colors.text },
  summarySub: { ...weight.regular, fontSize: 12, color: colors.textSecondary },

  sectionTitle: {
    fontSize: 13, ...weight.bold, color: colors.textTertiary,
    letterSpacing: 0.6, marginBottom: 12,
  },
  /* Grilla 3 columnas: celdas de ancho fijo → tarjetas siempre iguales */
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5 },
  moduleCell: { width: '33.33%', padding: 5 },
  module: {
    alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.surface, borderRadius: 18,
    paddingVertical: 16, paddingHorizontal: 6, minHeight: 106,
    ...shadow.xs,
  },
  moduleIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  moduleLabel: { fontSize: 13, ...weight.semibold, color: colors.text, textAlign: 'center', lineHeight: 17 },

  pressed: { transform: [{ scale: 0.96 }] },
})
