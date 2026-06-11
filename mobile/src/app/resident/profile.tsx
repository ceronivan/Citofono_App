import { useRouter } from 'expo-router'
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Avatar, Btn, Card, Screen } from '../../components/ui'
import { confirmAsk } from '../../stores/confirm'
import { useAuth, useMembership } from '../../stores/auth'
import { colors, weight } from '../../theme'

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <View style={s.field}>
      <Text style={s.fieldLabel}>{label}</Text>
      <Text style={s.fieldValue}>{value || '—'}</Text>
    </View>
  )
}

export default function Profile() {
  const router = useRouter()
  const user = useAuth((s) => s.user)
  const logout = useAuth((s) => s.logout)
  const membership = useMembership()

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

  return (
    <Screen title="Mi Perfil" showBack={false}>
      <View style={{ alignItems: 'center', marginVertical: 12 }}>
        <Avatar url={user?.photoUrl} size={96} />
        <Text style={s.name}>{user?.firstName} {user?.lastName}</Text>
        <Text style={s.email}>{user?.email}</Text>
      </View>

      <Card style={{ gap: 0 }}>
        <Field label="Apartamento" value={membership?.apartmentNumber ? `${membership.tower ?? ''} ${membership.apartmentNumber}`.trim() : undefined} />
        <Field label="Cédula" value={user?.idNumber} />
        <Field label="Celular" value={user?.phone} />
        <Field label="RH" value={user?.bloodType} />
        <Field label="Contacto de emergencia" value={user?.emergencyContact ? `${user.emergencyContact.name} · ${user.emergencyContact.phone} (${user.emergencyContact.relationship})` : undefined} />
      </Card>

      <Btn variant="danger" icon="logout-variant" onPress={handleLogout} style={{ marginTop: 24 }}>
        Cerrar sesión
      </Btn>
    </Screen>
  )
}

const s = StyleSheet.create({
  name: { fontSize: 20, ...weight.extrabold, letterSpacing: -0.4, color: colors.text, marginTop: 12 },
  email: { ...weight.regular, fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  field: {
    paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  fieldLabel: { fontSize: 12.5, ...weight.semibold, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.4 },
  fieldValue: { ...weight.regular, fontSize: 14.5, color: colors.text, marginTop: 2 },
})
