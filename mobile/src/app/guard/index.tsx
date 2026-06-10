import { useRouter } from 'expo-router'
import React from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BuildingSwitcher } from '../../components/BuildingSwitcher'
import { Icon, ListRow } from '../../components/ui'
import { confirmAsk } from '../../stores/confirm'
import { useAuth } from '../../stores/auth'
import { colors } from '../../theme'

const ACTIONS = [
  { title: 'Registrar Visita', sub: 'Peatonal o vehicular', icon: 'walk', href: '/guard/visit-new', bg: '#DCFCE7', color: '#16A34A' },
  { title: 'Verificar Domicilio', sub: 'Validar código de entrega', icon: 'moped-outline', href: '/guard/deliveries', bg: '#EDE9FF', color: '#7C3AED' },
  { title: 'Registrar Correspondencia', sub: 'Paquetes, cartas y documentos', icon: 'package-variant-closed', href: '/guard/mail-new', bg: '#FEF3C7', color: '#D97706' },
  { title: 'Autorizaciones', sub: 'Buscar por apto o nombre', icon: 'shield-account-outline', href: '/guard/authorizations', bg: '#DBEAFE', color: '#2563EB' },
  { title: 'Cámaras', sub: 'Monitoreo del edificio', icon: 'cctv', href: '/guard/cameras', bg: '#FEE2E2', color: '#DC2626' },
] as const

export default function GuardDashboard() {
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
        <View style={s.roleChip}><Text style={s.roleChipText}>Portería</Text></View>
        <View style={{ flex: 1 }} />
        <Pressable style={s.logoutBtn} onPress={handleLogout}>
          <Icon name="logout-variant" size={19} color={colors.textSecondary} />
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: 20 }}>
        <Text style={s.greeting}>{greeting()},</Text>
        <Text style={s.name}>{user?.firstName ?? 'Portero'}</Text>
        <View style={s.rolePill}>
          <Icon name="shield-outline" size={13} color={colors.guard} />
          <Text style={s.rolePillText}>Portería</Text>
        </View>

        <View style={{ gap: 8 }}>
          {ACTIONS.map((item) => (
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
  roleChip: { backgroundColor: colors.successSoft, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  roleChipText: { fontSize: 10, fontWeight: '800', color: colors.guard },
  logoutBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  greeting: { fontSize: 15, color: colors.textSecondary, fontWeight: '500', marginTop: 12 },
  name: { fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -0.8 },
  rolePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(16,185,129,0.1)', alignSelf: 'flex-start',
    borderRadius: 9999, paddingHorizontal: 12, paddingVertical: 4,
    marginTop: 8, marginBottom: 22,
  },
  rolePillText: { fontSize: 12, fontWeight: '600', color: colors.guard },
})
