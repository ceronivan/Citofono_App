import dayjs from 'dayjs'
import React, { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { BottomSheet, Btn, EmptyState, Icon, Input, Screen } from '../../components/ui'
import * as db from '../../data/db'
import { useCollection } from '../../hooks/useCollection'
import { useAuth, useComplexId, useMembership } from '../../stores/auth'
import { confirmAsk } from '../../stores/confirm'
import { colors, shadow, weight } from '../../theme'
import type { Delivery } from '../../types'

const VENDORS = [
  { name: 'Pizza', icon: 'pizza' },
  { name: 'Hamburguesa', icon: 'hamburger' },
  { name: 'Mercado', icon: 'cart-outline' },
  { name: 'Farmacia', icon: 'pill' },
  { name: 'Paquete', icon: 'package-variant-closed' },
  { name: 'Otro', icon: 'moped-outline' },
]

const STATUS_META: Record<string, { label: string; color: string; icon: string }> = {
  expected: { label: 'En camino', color: '#D97706', icon: 'moped-outline' },
  delivered: { label: 'Entregado', color: '#16A34A', icon: 'check-circle-outline' },
  cancelled: { label: 'Cancelado', color: '#9CA3AF', icon: 'close-circle-outline' },
}

export default function Deliveries() {
  const user = useAuth((s) => s.user)
  const membership = useMembership()
  const complexId = useComplexId()
  const items = useCollection<Delivery>(
    'deliveries',
    (d) => d.residentId === user?.id,
    (a, b) => b.createdAt - a.createdAt,
  )

  const [open, setOpen] = useState(false)
  const [vendor, setVendor] = useState('')
  const [description, setDescription] = useState('')
  const [code, setCode] = useState('')

  const canSave = vendor.trim() && /^\d{4,6}$/.test(code.trim())

  function save() {
    if (!complexId || !user) return
    db.add(db.col(complexId, 'deliveries'), {
      residentId: user.id,
      apartmentNumber: membership?.apartmentNumber ?? '',
      ...(membership?.tower ? { tower: membership.tower } : {}),
      ...(membership?.unitId ? { unitId: membership.unitId } : {}),
      vendor: vendor.trim(),
      description: description.trim(),
      code: code.trim(),
      status: 'expected',
    })
    setOpen(false)
    setVendor(''); setDescription(''); setCode('')
  }

  async function cancel(d: Delivery) {
    const ok = await confirmAsk({
      title: '¿Cancelar domicilio?',
      message: `Portería ya no autorizará el código ${d.code} de ${d.vendor}.`,
      confirmText: 'Sí, cancelar',
      cancelText: 'Volver',
    })
    if (ok && complexId) db.update(db.col(complexId, 'deliveries'), d.id, { status: 'cancelled' })
  }

  return (
    <Screen title="Mis Domicilios">
      <Text style={s.intro}>
        Registra el código de tu domicilio para que portería autorice la entrega sin llamarte.
      </Text>
      <Btn icon="plus" onPress={() => setOpen(true)} style={{ marginBottom: 16 }}>
        Registrar domicilio
      </Btn>

      {items.length === 0 ? (
        <EmptyState icon="moped-outline" message="No tienes domicilios registrados" />
      ) : (
        <View style={{ gap: 10 }}>
          {items.map((d) => {
            const meta = STATUS_META[d.status]
            return (
              <View key={d.id} style={s.card}>
                <View style={[s.cardIcon, { backgroundColor: meta.color + '18' }]}>
                  <Icon name={meta.icon} size={22} color={meta.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.vendor}>{d.vendor}</Text>
                  {d.description ? <Text style={s.desc} numberOfLines={1}>{d.description}</Text> : null}
                  <Text style={s.date}>{dayjs(d.createdAt).format('DD MMM, h:mm a')}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 3 }}>
                  {d.status === 'expected' && <Text style={s.code}>{d.code}</Text>}
                  <Text style={[s.status, { color: meta.color }]}>{meta.label}</Text>
                  {d.status === 'expected' && (
                    <Pressable onPress={() => cancel(d)}>
                      <Text style={s.cancel}>Cancelar</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            )
          })}
        </View>
      )}

      <BottomSheet visible={open} onClose={() => setOpen(false)} title="Registrar domicilio">
        <Text style={s.sheetLabel}>¿Qué esperas?</Text>
        <View style={s.vendorGrid}>
          {VENDORS.map((v) => (
            <Pressable
              key={v.name}
              style={[s.vendorChip, vendor === v.name && s.vendorChipOn]}
              onPress={() => setVendor(v.name)}
            >
              <Icon name={v.icon} size={18} color={vendor === v.name ? colors.primary : colors.textSecondary} />
              <Text style={[s.vendorChipText, vendor === v.name && { color: colors.primary }]}>{v.name}</Text>
            </Pressable>
          ))}
        </View>
        <View style={{ gap: 12, marginTop: 14 }}>
          <Input label="Negocio / App" placeholder="Domino's, Rappi…" value={vendor} onChangeText={setVendor} />
          <Input label="Detalle (opcional)" placeholder="Pizza grande pepperoni" value={description} onChangeText={setDescription} />
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
            <View style={{ flex: 1 }}>
              <Input label="Código de entrega" placeholder="4821" keyboardType="number-pad" maxLength={6} value={code} onChangeText={setCode} />
            </View>
            <Btn variant="secondary" icon="dice-multiple-outline" onPress={() => setCode(String(Math.floor(1000 + Math.random() * 9000)))}>
              Generar
            </Btn>
          </View>
          <Text style={s.hint}>Usa el código que te dio la app de domicilios, o genera uno y dáselo al repartidor.</Text>
          <Btn disabled={!canSave} onPress={save}>Registrar</Btn>
        </View>
      </BottomSheet>
    </Screen>
  )
}

const s = StyleSheet.create({
  intro: { ...weight.regular, fontSize: 14.5, color: colors.textSecondary, lineHeight: 19, marginBottom: 14 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surface, borderRadius: 16, padding: 13, ...shadow.xs,
  },
  cardIcon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  vendor: { fontSize: 14, ...weight.bold, color: colors.text },
  desc: { ...weight.regular, fontSize: 13, color: colors.textSecondary },
  date: { ...weight.regular, fontSize: 12, color: colors.textTertiary, marginTop: 1 },
  code: {
    fontSize: 16, ...weight.extrabold, letterSpacing: 2, color: colors.primary,
    backgroundColor: colors.primarySoft, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 2, overflow: 'hidden',
  },
  status: { fontSize: 12, ...weight.semibold },
  cancel: { ...weight.regular, fontSize: 12, color: colors.textTertiary, textDecorationLine: 'underline' },

  sheetLabel: { ...weight.regular, fontSize: 13, color: colors.textSecondary, marginBottom: 8 },
  vendorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  vendorChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.surface2, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 9,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  vendorChipOn: { borderColor: colors.primary, backgroundColor: colors.primary10 },
  vendorChipText: { fontSize: 13, ...weight.semibold, color: colors.textSecondary },
  hint: { ...weight.regular, fontSize: 13, color: colors.textTertiary, lineHeight: 17 },
})
