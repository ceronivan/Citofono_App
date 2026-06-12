import { yupResolver } from '@hookform/resolvers/yup'
import { useRouter } from 'expo-router'
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { StyleSheet, Text, View } from 'react-native'
import { Avatar, BottomSheet, Btn, Card, Icon, Screen } from '../../components/ui'
import { FormInput } from '../../forms/fields'
import { profileSchema, type ProfileForm } from '../../forms/schemas'
import { confirmAsk } from '../../stores/confirm'
import { RESIDENT_TYPE_META, useAuth, useMembership, useResidentType } from '../../stores/auth'
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
  const updateProfile = useAuth((s) => s.updateProfile)
  const membership = useMembership()
  const residentType = useResidentType()
  const typeMeta = residentType ? RESIDENT_TYPE_META[residentType] : null

  const [editing, setEditing] = useState(false)

  const { control, handleSubmit, reset, formState } = useForm<ProfileForm>({
    resolver: yupResolver(profileSchema),
    mode: 'onChange',
    defaultValues: { firstName: user?.firstName ?? '', lastName: user?.lastName ?? '', phone: user?.phone ?? '' },
  })

  function openEdit() {
    reset({ firstName: user?.firstName ?? '', lastName: user?.lastName ?? '', phone: user?.phone ?? '' })
    setEditing(true)
  }

  const save = handleSubmit((v) => {
    updateProfile({ firstName: v.firstName.trim(), lastName: v.lastName.trim(), phone: v.phone.trim() })
    setEditing(false)
  })

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
        {typeMeta && (
          <View style={s.typePill}>
            <Icon name={typeMeta.icon} size={13} color="#A16207" />
            <Text style={s.typePillText}>{typeMeta.label}</Text>
          </View>
        )}
      </View>

      <Card style={{ gap: 0 }}>
        <Field label="Apartamento" value={membership?.apartmentNumber ? `${membership.tower ?? ''} ${membership.apartmentNumber}`.trim() : undefined} />
        <Field label="Cédula" value={user?.idNumber} />
        <Field label="Celular" value={user?.phone} />
        <Field label="RH" value={user?.bloodType} />
        <Field label="Contacto de emergencia" value={user?.emergencyContact ? `${user.emergencyContact.name} · ${user.emergencyContact.phone} (${user.emergencyContact.relationship})` : undefined} />
      </Card>

      <Btn variant="secondary" icon="pencil-outline" onPress={openEdit} style={{ marginTop: 16 }}>
        Editar perfil
      </Btn>
      <Btn variant="danger" icon="logout-variant" onPress={handleLogout} style={{ marginTop: 10 }}>
        Cerrar sesión
      </Btn>

      <BottomSheet visible={editing} onClose={() => setEditing(false)} title="Editar perfil">
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}><FormInput control={control} name="firstName" label="Nombre" /></View>
            <View style={{ flex: 1 }}><FormInput control={control} name="lastName" label="Apellido" /></View>
          </View>
          <FormInput control={control} name="phone" label="Celular" keyboardType="phone-pad" />
          <Btn disabled={!formState.isValid} onPress={save}>Guardar cambios</Btn>
        </View>
      </BottomSheet>
    </Screen>
  )
}

const s = StyleSheet.create({
  name: { fontSize: 20, ...weight.extrabold, letterSpacing: -0.4, color: colors.text, marginTop: 12 },
  email: { ...weight.regular, fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  typePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#FEF9C3', borderRadius: 9999,
    paddingHorizontal: 12, paddingVertical: 4, marginTop: 10,
  },
  typePillText: { fontSize: 12.5, ...weight.semibold, color: '#A16207' },
  field: {
    paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  fieldLabel: { fontSize: 12.5, ...weight.semibold, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.4 },
  fieldValue: { ...weight.regular, fontSize: 14.5, color: colors.text, marginTop: 2 },
})
