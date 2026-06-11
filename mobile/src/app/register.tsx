import { useRouter } from 'expo-router'
import React, { useState } from 'react'
import { StyleSheet, Text, TextInput, View } from 'react-native'
import * as db from '../data/db'
import { Btn, Icon, Input, Screen, SelectSheet } from '../components/ui'
import { DASHBOARD, useAuth } from '../stores/auth'
import { colors } from '../theme'
import type { Invite } from '../types'

const ROLE_LABEL: Record<string, string> = { resident: 'Residente', admin: 'Administrador', guard: 'Portería' }

const ERRORS: Record<string, string> = {
  'auth/email-already-in-use': 'Este correo ya tiene una cuenta',
  'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
  INVITE_NOT_FOUND: 'Código no encontrado. Verifica con tu administrador.',
  INVITE_INACTIVE: 'Este código fue desactivado',
  INVITE_EXHAUSTED: 'Este código ya alcanzó su límite de usos',
}

export default function Register() {
  const router = useRouter()
  const { registerWithInvite, registerAdmin } = useAuth()

  const [mode, setMode] = useState<'code' | 'form' | 'admin-form'>('code')
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState('')
  const [invite, setInvite] = useState<Invite | null>(null)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [idNumber, setIdNumber] = useState('')
  const [phone, setPhone] = useState('')
  const [tower, setTower] = useState('')
  const [apartmentNumber, setApartmentNumber] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  async function validateCode() {
    await db.ready()
    setCodeError('')
    const inv = db.find<Invite & { id: string }>('invites', code.trim().toUpperCase())
    if (!inv) return setCodeError('Código no encontrado. Verifica con tu administrador.')
    if (!inv.active) return setCodeError('Este código fue desactivado.')
    if (inv.maxUses > 0 && inv.usedCount >= inv.maxUses) return setCodeError('Este código ya alcanzó su límite de usos.')
    setInvite(inv)
    setMode('form')
  }

  const isResident = invite?.role === 'resident'
  const towers = invite?.towers ?? []
  const canSubmit =
    firstName.trim() && lastName.trim() && phone.trim() && idNumber.trim() &&
    /\S+@\S+\.\S+/.test(email) && password.length >= 6 &&
    (mode === 'admin-form' || !isResident || (apartmentNumber.trim() && (towers.length <= 1 || tower)))

  async function submit() {
    setSaving(true)
    setFormError('')
    try {
      if (mode === 'admin-form') {
        await registerAdmin({ email, password, firstName, lastName, phone, idNumber })
        router.replace('/setup-building' as never)
        return
      }
      const selectedTower = towers.length === 1 ? towers[0] : tower
      const user = await registerWithInvite({
        email, password, firstName, lastName, phone, idNumber,
        inviteCode: invite!.id,
        ...(isResident ? { tower: selectedTower, apartmentNumber } : {}),
      })
      const role = user.memberships[0]?.role ?? 'resident'
      router.replace(DASHBOARD[role] as never)
    } catch (e) {
      setFormError(ERRORS[(e as { code?: string }).code ?? ''] ?? 'Error al crear la cuenta')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Screen title={mode === 'code' ? '' : 'Crear cuenta'}>
      {mode === 'code' ? (
        <View>
          <View style={s.badge}>
            <Icon name="ticket-confirmation-outline" size={30} color="#fff" />
          </View>
          <Text style={s.title}>Únete a tu edificio</Text>
          <Text style={s.sub}>Ingresa el código de invitación que te compartió tu administrador</Text>

          <TextInput
            style={[s.codeInput, codeError ? { borderColor: colors.error } : null]}
            placeholder="PRADO-DEMO"
            placeholderTextColor={colors.textDisabled}
            autoCapitalize="characters"
            value={code}
            onChangeText={(v) => { setCode(v); setCodeError('') }}
          />
          {codeError ? <Text style={s.codeError}>{codeError}</Text> : null}

          <Btn disabled={!code.trim()} onPress={validateCode} style={{ marginTop: 16 }}>
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
                <Text style={s.inviteBannerRole}>Te unirás como {ROLE_LABEL[invite.role]}</Text>
              </View>
            </View>
          )}

          <View style={s.row}>
            <View style={{ flex: 1 }}><Input label="Nombre" value={firstName} onChangeText={setFirstName} /></View>
            <View style={{ flex: 1 }}><Input label="Apellido" value={lastName} onChangeText={setLastName} /></View>
          </View>
          <Input label="Cédula" keyboardType="number-pad" value={idNumber} onChangeText={setIdNumber} />
          <Input label="Celular" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />

          {mode === 'form' && isResident && (
            <View style={s.row}>
              {towers.length > 1 && (
                <View style={{ flex: 1 }}>
                  <SelectSheet
                    label="Torre"
                    value={tower}
                    options={towers.map((t) => ({ value: t, title: t }))}
                    onChange={setTower}
                  />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Input label="Apto" placeholder="501" keyboardType="number-pad" value={apartmentNumber} onChangeText={setApartmentNumber} />
              </View>
            </View>
          )}

          <Input label="Correo electrónico" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
          <Input label="Contraseña (mín. 6 caracteres)" secureTextEntry value={password} onChangeText={setPassword} />

          {formError ? <Text style={s.codeError}>{formError}</Text> : null}

          <Btn loading={saving} disabled={!canSubmit} onPress={submit} style={{ marginTop: 6 }}>
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
  title: { fontSize: 26, fontWeight: '800', letterSpacing: -0.6, color: colors.text },
  sub: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginTop: 4, marginBottom: 24 },

  codeInput: {
    borderWidth: 2, borderColor: colors.border, borderRadius: 18,
    backgroundColor: colors.surface,
    textAlign: 'center', fontSize: 24, fontWeight: '800', letterSpacing: 4,
    paddingVertical: 18, color: colors.text,
  },
  codeError: { color: colors.error, fontSize: 14, fontWeight: '500', marginTop: 8 },

  divider: { alignItems: 'center', marginVertical: 18 },
  dividerText: { fontSize: 13, color: colors.textTertiary },

  inviteBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.primarySoft, borderRadius: 16, padding: 14,
  },
  inviteBannerName: { fontSize: 14, fontWeight: '700', color: colors.primary },
  inviteBannerRole: { fontSize: 13, color: colors.primary, opacity: 0.8 },

  row: { flexDirection: 'row', gap: 10 },
})
