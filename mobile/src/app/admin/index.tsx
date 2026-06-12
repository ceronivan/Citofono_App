import { useRouter } from 'expo-router'
import React from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BuildingSwitcher } from '../../components/BuildingSwitcher'
import { Icon, ListRow } from '../../components/ui'
import { confirmAsk } from '../../stores/confirm'
import { useAuth } from '../../stores/auth'
import { colors, weight } from '../../theme'

const SECTIONS = [
  { title: 'Mi Edificio', sub: 'Unidades, cartera, amenidades e invitaciones', icon: 'office-building-outline', href: '/admin/building', bg: '#E0F2FE', color: '#0EA5E9' },
  { title: 'Facturación', sub: 'Cuotas, gastos y contabilidad', icon: 'finance', href: '/admin/billing', bg: '#DCFCE7', color: '#15803D' },
  { title: 'Reservas', sub: 'Aprobar o rechazar solicitudes', icon: 'calendar-check-outline', href: '/admin/reservations', bg: '#DCFCE7', color: '#16A34A' },
  { title: 'PQRs', sub: 'Gestionar peticiones y quejas', icon: 'message-alert-outline', href: '/admin/pqrs', bg: '#FEE2E2', color: '#DC2626' },
  { title: 'Reportes de Daños', sub: 'Revisar reportes de daños', icon: 'wrench-outline', href: '/admin/damage', bg: '#FEF3C7', color: '#D97706' },
  { title: 'Multas y llamados', sub: 'Sanciones por unidad', icon: 'gavel', href: '/admin/sanctions', bg: '#FEF9C3', color: '#A16207' },
  { title: 'Publicar contenido', sub: 'Noticias y circulares', icon: 'newspaper-variant-outline', href: '/admin/news', bg: '#EDE9FF', color: '#4F35E8' },
] as const

export default function AdminDashboard() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const user = useAuth((s) => s.user)
  const logout = useAuth((s) => s.logout)

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
    if (ok) { await logout(); router.replace('/login') }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: 32 }}>
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <BuildingSwitcher />
        <View style={s.roleChip}><Text style={s.roleChipText}>Admin</Text></View>
        <View style={{ flex: 1 }} />
        <Pressable style={s.logoutBtn} onPress={handleLogout}>
          <Icon name="logout-variant" size={19} color={colors.textSecondary} />
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: 20 }}>
        <Text style={s.greeting}>{greeting()},</Text>
        <Text style={s.name}>{user?.firstName ?? 'Administrador'}</Text>
        <View style={s.rolePill}>
          <Icon name="shield-crown-outline" size={13} color={colors.admin} />
          <Text style={s.rolePillText}>Administración</Text>
        </View>

        <View style={{ gap: 8 }}>
          {SECTIONS.map((item) => (
            <ListRow
              key={item.href}
              icon={item.icon}
              iconBg={item.bg}
              iconColor={item.color}
              title={item.title}
              subtitle={item.sub}
              right={<Icon name="chevron-right" size={18} color={colors.textTertiary} />}
              onPress={() => router.push(item.href as never)}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingBottom: 8 },
  roleChip: { backgroundColor: colors.infoSoft, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  roleChipText: { fontSize: 12, ...weight.extrabold, color: colors.admin },
  logoutBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center',
  },
  greeting: { fontSize: 15, color: colors.textSecondary, ...weight.medium, marginTop: 12 },
  name: { fontSize: 28, ...weight.extrabold, color: colors.text, letterSpacing: -0.8 },
  rolePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(14,165,233,0.1)', alignSelf: 'flex-start',
    borderRadius: 9999, paddingHorizontal: 12, paddingVertical: 4,
    marginTop: 8, marginBottom: 22,
  },
  rolePillText: { fontSize: 13, ...weight.semibold, color: colors.admin },
})
