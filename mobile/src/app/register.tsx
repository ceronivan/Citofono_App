import { yupResolver } from '@hookform/resolvers/yup'
import { useRouter } from 'expo-router'
import React, { useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { StyleSheet, Text, TextInput, View } from 'react-native'
import { Btn, Icon, Screen } from '../components/ui'
import * as db from '../data/db'
import { FormInput, FormSelect } from '../forms/fields'
import {
  inviteCodeSchema,
  registerSchema,
  type InviteCodeForm,
  type RegisterForm,
} from '../forms/schemas'
import { DASHBOARD, useAuth } from '../stores/auth'
import { colors, weight } from '../theme'
import type { Invite } from '../types'

const ROLE_LABEL: Record<string, string> = { resident: 'Residente', admin: 'Administrador', guard: 'Portería' }
const TYPE_LABEL: Record<string, string> = {
  owner_resident: 'Propietario residente',
  owner: 'Propietario (no habita)',
  tenant: 'Habitante (arrendatario)',
}

const ERRORS: Record<string, string> = {
  'auth/email-already-in-use': 'Este correo ya tiene una cuenta',
  'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
}

export default function Register() {
  const router = useRouter()
  const { registerWithInvite, registerAdmin } = useAuth()

  const [mode, setMode] = useState<'code' | 'form' | 'admin-form'>('code')
  const [invite, setInvite] = useState<Invite | null>(null)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  // ── Paso 1: código de invitación ────────────────────────────────────────────
  const codeForm = useForm<InviteCodeForm>({
    resolver: yupResolver(inviteCodeSchema),
    mode: 'onChange',
    defaultValues: { code: '' },
  })

  const validateCode = codeForm.handleSubmit(async ({ code }) => {
    await db.ready()
    const fail = (message: string) => codeForm.setError('code', { type: 'manual', message })
    const inv = db.find<Invite & { id: string }>('invites', code.trim().toUpperCase())
    if (!inv) return fail('Código no encontrado. Verifica con tu administrador.')
    if (!inv.active) return fail('Este código fue desactivado.')
    if (inv.maxUses > 0 && inv.usedCount >= inv.maxUses) return fail('Este código ya alcanzó su límite de usos.')
    setInvite(inv)
    setMode('form')
  })

  // ── Paso 2: datos personales (esquema condicional por rol/torres) ──────────
  const isResident = mode === 'form' && invite?.role === 'resident'
  const towers = invite?.towers ?? []
  const multiTower = isResident && towers.length > 1
  const schema = useMemo(() => registerSchema(isResident, multiTower), [isResident, multiTower])

  const { control, handleSubmit, formState } = useForm<RegisterForm>({
    resolver: yupResolver(schema),
    mode: 'onChange',
    defaultValues: {
      firstName: '', lastName: '', idNumber: '', phone: '',
      email: '', password: '', tower: '', apartmentNumber: '',
    },
  })

  const submit = handleSubmit(async (v) => {
    setSaving(true)
    setFormError('')
    try {
      if (mode === 'admin-form') {
        await registerAdmin({
          email: v.email, password: v.password,
          firstName: v.firstName, lastName: v.lastName, phone: v.phone, idNumber: v.idNumber,
        })
        router.replace('/setup-building' as never)
        return
      }
      const selectedTower = towers.length === 1 ? towers[0] : v.tower
      const user = await registerWithInvite({
        email: v.email, password: v.password,
        firstName: v.firstName, lastName: v.lastName, phone: v.phone, idNumber: v.idNumber,
        inviteCode: invite!.id,
        ...(isResident ? { tower: selectedTower, apartmentNumber: v.apartmentNumber } : {}),
      })
      const role = user.memberships[0]?.role ?? 'resident'
      router.replace(DASHBOARD[role] as never)
    } catch (e) {
      setFormError(ERRORS[(e as { code?: string }).code ?? ''] ?? 'Error al crear la cuenta')
    } finally {
      setSaving(false)
    }
  })

  return (
    <Screen title={mode === 'code' ? '' : 'Crear cuenta'}>
      {mode === 'code' ? (
        <View>
          <View style={s.badge}>
            <Icon name="ticket-confirmation-outline" size={30} color="#fff" />
          </View>
          <Text style={s.title}>Únete a tu edificio</Text>
          <Text style={s.sub}>Ingresa el código de invitación que te compartió tu administrador</Text>

          <Controller
            control={codeForm.control}
            name="code"
            render={({ field, fieldState }) => (
              <>
                <TextInput
                  style={[s.codeInput, fieldState.error ? { borderColor: colors.error } : null]}
                  placeholder="PRADO-DEMO"
                  placeholderTextColor={colors.textDisabled}
                  autoCapitalize="characters"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                />
                {fieldState.error ? <Text style={s.codeError}>{fieldState.error.message}</Text> : null}
              </>
            )}
          />

          <Btn disabled={!codeForm.formState.isValid} onPress={validateCode} style={{ marginTop: 16 }}>
            Validar código
          </Btn>

          <View style={s.divider}><Text style={s.dividerText}>o</Text></View>

          <Btn variant="secondary" icon="shield-crown-outline" onPress={() => setMode('admin-form')}>
            Soy administrador — crear mi edificio
          </Btn>
        </View>
      ) : (
        <View style={{ gap: 14 }}>
          {mode === 'form' && invite && (
            <View style={s.inviteBanner}>
              <Icon name="office-building" size={18} color={colors.primary} />
              <View>
                <Text style={s.inviteBannerName}>{invite.complexName}</Text>
                <Text style={s.inviteBannerRole}>
                  Te unirás como {invite.role === 'resident' && invite.residentType
                    ? TYPE_LABEL[invite.residentType]
                    : ROLE_LABEL[invite.role]}
                </Text>
              </View>
            </View>
          )}

          <View style={s.row}>
            <View style={{ flex: 1 }}><FormInput control={control} name="firstName" label="Nombre" /></View>
            <View style={{ flex: 1 }}><FormInput control={control} name="lastName" label="Apellido" /></View>
          </View>
          <FormInput control={control} name="idNumber" label="Cédula" keyboardType="number-pad" />
          <FormInput control={control} name="phone" label="Celular" keyboardType="phone-pad" />

          {isResident && (
            <View style={s.row}>
              {multiTower && (
                <View style={{ flex: 1 }}>
                  <FormSelect
                    control={control}
                    name="tower"
                    label="Torre"
                    options={towers.map((t) => ({ value: t, title: t }))}
                  />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <FormInput control={control} name="apartmentNumber" label="Apto" placeholder="501" keyboardType="number-pad" />
              </View>
            </View>
          )}

          <FormInput control={control} name="email" label="Correo electrónico" autoCapitalize="none" keyboardType="email-address" />
          <FormInput control={control} name="password" label="Contraseña (mín. 6 caracteres)" secureTextEntry />

          {formError ? <Text style={s.codeError}>{formError}</Text> : null}

          <Btn loading={saving} disabled={!formState.isValid} onPress={submit} style={{ marginTop: 6 }}>
            Crear cuenta
          </Btn>
        </View>
      )}
    </Screen>
  )
}

const s = StyleSheet.create({
  badge: {
    width: 60, height: 60, borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  title: { fontSize: 26, ...weight.extrabold, letterSpacing: -0.6, color: colors.text },
  sub: { ...weight.regular, fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginTop: 4, marginBottom: 24 },

  codeInput: {
    borderWidth: 2, borderColor: colors.border, borderRadius: 18,
    backgroundColor: colors.surface,
    textAlign: 'center', fontSize: 24, ...weight.extrabold, letterSpacing: 4,
    paddingVertical: 18, color: colors.text,
  },
  codeError: { color: colors.error, fontSize: 14, ...weight.medium, marginTop: 8 },

  divider: { alignItems: 'center', marginVertical: 18 },
  dividerText: { ...weight.regular, fontSize: 13, color: colors.textTertiary },

  inviteBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.primarySoft, borderRadius: 16, padding: 14,
  },
  inviteBannerName: { fontSize: 14, ...weight.bold, color: colors.primary },
  inviteBannerRole: { ...weight.regular, fontSize: 13, color: colors.primary, opacity: 0.8 },

  row: { flexDirection: 'row', gap: 10 },
})
