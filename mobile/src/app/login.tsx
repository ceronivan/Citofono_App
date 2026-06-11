import { Link, useRouter } from 'expo-router'
import React, { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Btn, Icon, Input, Screen } from '../components/ui'
import { DASHBOARD, useAuth } from '../stores/auth'
import { colors, shadow, weight } from '../theme'

const ERRORS: Record<string, string> = {
  'auth/invalid-credential': 'Correo o contraseña incorrectos',
  'auth/network-request-failed': 'Sin conexión a internet',
}

const DEMO_ACCOUNTS = [
  { email: 'residente@demo.com', label: 'Residente', icon: 'account-outline', color: colors.resident },
  { email: 'admin@demo.com', label: 'Admin', icon: 'shield-crown-outline', color: colors.admin },
  { email: 'portero@demo.com', label: 'Portería', icon: 'security', color: colors.guard },
]

export default function Login() {
  const router = useRouter()
  const login = useAuth((s) => s.login)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [demoLoading, setDemoLoading] = useState('')

  async function go(mail: string, pwd: string) {
    setError('')
    try {
      const user = await login(mail, pwd)
      const role = user.memberships[0]?.role
      router.replace((role ? DASHBOARD[role] : '/setup-building') as never)
    } catch (e) {
      setError(ERRORS[(e as { code?: string }).code ?? ''] ?? 'Error al iniciar sesión')
    }
  }

  return (
    <Screen scroll padded={false}>
      <View style={s.wrap}>
        <View style={s.logo}>
          <Icon name="shield-home" size={32} color="#fff" />
        </View>
        <Text style={s.appName}>PortalResidencial</Text>
        <Text style={s.tagline}>Gestión inteligente de tu conjunto</Text>

        <View style={s.card}>
          <Text style={s.cardTitle}>Bienvenido</Text>
          <Text style={s.cardSub}>Ingresa con tu cuenta para continuar</Text>

          {error ? (
            <View style={s.error}>
              <Icon name="alert-circle-outline" size={16} color="#B91C1C" />
              <Text style={s.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={{ gap: 14 }}>
            <Input
              label="Correo electrónico"
              placeholder="tu@correo.com"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <Input
              label="Contraseña"
              placeholder="••••••••"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <Btn
              loading={loading}
              disabled={!email || !password}
              onPress={async () => { setLoading(true); await go(email, password); setLoading(false) }}
            >
              Ingresar
            </Btn>
          </View>
        </View>

        {/* Acceso rápido demo */}
        <View style={s.demoPanel}>
          <View style={s.demoHead}>
            <View style={s.demoBadge}><Text style={s.demoBadgeText}>DEMO</Text></View>
            <Text style={s.demoTitle}>Explora la app con un toque</Text>
          </View>
          <View style={s.demoRow}>
            {DEMO_ACCOUNTS.map((acc) => (
              <Pressable
                key={acc.email}
                style={({ pressed }) => [s.demoAccount, pressed && { transform: [{ scale: 0.94 }] }]}
                disabled={!!demoLoading}
                onPress={async () => {
                  setDemoLoading(acc.email)
                  await go(acc.email, 'demo123')
                  setDemoLoading('')
                }}
              >
                <View style={[s.demoIcon, { backgroundColor: acc.color + '1F' }]}>
                  <Icon name={acc.icon} size={20} color={acc.color} />
                </View>
                <Text style={s.demoLabel}>{acc.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={s.registerCta}>
          <Text style={{ ...weight.regular, fontSize: 14, color: colors.textSecondary }}>¿Nuevo aquí?</Text>
          <Link href="/register" style={s.registerLink}>Regístrate con tu código de invitación</Link>
        </View>
      </View>
    </Screen>
  )
}

const s = StyleSheet.create({
  wrap: { padding: 24, paddingTop: 48, maxWidth: 420, width: '100%', alignSelf: 'center' },
  logo: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', alignSelf: 'center',
    marginBottom: 14, ...shadow.md,
  },
  appName: { fontSize: 24, ...weight.extrabold, letterSpacing: -0.5, textAlign: 'center', color: colors.text },
  tagline: { ...weight.regular, fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginTop: 4, marginBottom: 28 },

  card: { backgroundColor: colors.surface, borderRadius: 28, padding: 24, ...shadow.sm },
  cardTitle: { fontSize: 20, ...weight.extrabold, letterSpacing: -0.3, color: colors.text },
  cardSub: { ...weight.regular, fontSize: 14, color: colors.textSecondary, marginTop: 2, marginBottom: 20 },

  error: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.errorSoft, borderRadius: 12,
    padding: 12, marginBottom: 16,
  },
  errorText: { flex: 1, fontSize: 14, ...weight.medium, color: '#B91C1C' },

  demoPanel: {
    marginTop: 20, borderRadius: 20, padding: 16,
    backgroundColor: colors.surface,
    borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.border,
  },
  demoHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  demoBadge: { backgroundColor: colors.primary, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  demoBadgeText: { fontSize: 12, ...weight.extrabold, letterSpacing: 1, color: '#fff' },
  demoTitle: { fontSize: 13.5, ...weight.semibold, color: colors.textSecondary },
  demoRow: { flexDirection: 'row', gap: 8 },
  demoAccount: {
    flex: 1, alignItems: 'center', gap: 6,
    backgroundColor: colors.surface2, borderRadius: 14, paddingVertical: 12,
  },
  demoIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  demoLabel: { fontSize: 13, ...weight.bold, color: colors.text },

  registerCta: { alignItems: 'center', gap: 2, marginTop: 22 },
  registerLink: { fontSize: 14, ...weight.bold, color: colors.primary },
})
