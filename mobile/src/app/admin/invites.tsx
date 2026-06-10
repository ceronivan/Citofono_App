import React, { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native'
import { BottomSheet, Btn, EmptyState, Screen, SelectSheet } from '../../components/ui'
import * as db from '../../data/db'
import { useDataVersion } from '../../data/version'
import { useGlobalCollection } from '../../hooks/useCollection'
import { useAuth, useComplexId } from '../../stores/auth'
import { confirmAsk } from '../../stores/confirm'
import { colors, shadow } from '../../theme'
import type { Complex, Invite, UserRole } from '../../types'

const ROLE_LABEL: Record<UserRole, string> = { resident: 'Residente', admin: 'Co-admin', guard: 'Portería' }
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

export default function Invites() {
  const user = useAuth((s) => s.user)
  const complexId = useComplexId()
  const version = useDataVersion((s) => s.version)
  const complex = useMemo(
    () => (complexId ? db.find<Complex & { id: string }>('complexes', complexId) : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [complexId, version],
  )
  const invites = useGlobalCollection<Invite>('invites', (i) => i.complexId === complexId)

  const [open, setOpen] = useState(false)
  const [role, setRole] = useState<UserRole>('resident')

  function create() {
    if (!complexId || !complex || !user) return
    const prefix = complex.name.split(/\s+/).filter((w) => w.length > 2)[0]?.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5) || 'PORTAL'
    let rnd = ''
    for (let i = 0; i < 4; i++) rnd += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
    db.add('invites', {
      id: `${prefix}-${rnd}`,
      complexId, complexName: complex.name, towers: complex.towers,
      role, maxUses: 0, usedCount: 0, active: true, createdBy: user.id,
    })
    setOpen(false)
  }

  async function remove(inv: Invite) {
    const ok = await confirmAsk({
      title: '¿Eliminar código?',
      message: `El código ${inv.id} dejará de funcionar. Si solo quieres pausarlo, desactívalo con el switch.`,
    })
    if (ok) db.remove('invites', inv.id)
  }

  return (
    <Screen title="Invitaciones">
      <Text style={s.intro}>
        Crea códigos para que residentes, porteros o co-administradores se unan a {complex?.name}.
      </Text>
      <Btn icon="plus" onPress={() => setOpen(true)} style={{ marginBottom: 16 }}>Nuevo código</Btn>

      {invites.length === 0 ? (
        <EmptyState icon="ticket-confirmation-outline" message="Aún no has creado códigos" />
      ) : (
        <View style={{ gap: 10 }}>
          {invites.map((inv) => (
            <View key={inv.id} style={[s.card, !inv.active && { opacity: 0.55 }]}>
              <View style={{ flex: 1, gap: 6 }}>
                <View style={s.codeBox}><Text style={s.code}>{inv.id}</Text></View>
                <Text style={s.meta}>
                  {ROLE_LABEL[inv.role]} · {inv.maxUses > 0 ? `${inv.usedCount}/${inv.maxUses} usos` : `${inv.usedCount} usos · ilimitado`}
                </Text>
              </View>
              <Switch
                value={inv.active}
                onValueChange={(v) => { db.update('invites', inv.id, { active: v }) }}
                trackColor={{ true: colors.primary }}
              />
              <Pressable onPress={() => remove(inv)} hitSlop={8}>
                <Text style={{ color: colors.error, fontSize: 12, fontWeight: '600' }}>Eliminar</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <BottomSheet visible={open} onClose={() => setOpen(false)} title="Nuevo código de invitación">
        <View style={{ gap: 14 }}>
          <SelectSheet
            label="Rol"
            value={role}
            options={[
              { value: 'resident', title: 'Residente / Propietario' },
              { value: 'guard', title: 'Portería' },
              { value: 'admin', title: 'Co-administrador' },
            ]}
            onChange={setRole}
          />
          <Btn onPress={create}>Crear</Btn>
        </View>
      </BottomSheet>
    </Screen>
  )
}

const s = StyleSheet.create({
  intro: { fontSize: 13.5, color: colors.textSecondary, lineHeight: 19, marginBottom: 14 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.surface, borderRadius: 16, padding: 13, ...shadow.xs,
  },
  codeBox: {
    backgroundColor: colors.primarySoft, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start',
  },
  code: { fontSize: 16, fontWeight: '800', letterSpacing: 1.5, color: colors.primary },
  meta: { fontSize: 11.5, color: colors.textSecondary },
})
