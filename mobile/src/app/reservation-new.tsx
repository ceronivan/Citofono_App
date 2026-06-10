import { useRouter } from 'expo-router'
import React, { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Btn, Icon, Input, Screen } from '../components/ui'
import * as db from '../data/db'
import { useDataVersion } from '../data/version'
import { useAuth, useComplexId, useMembership } from '../stores/auth'
import { colors, shadow } from '../theme'
import type { Complex, Unit } from '../types'

export default function ReservationNew() {
  const router = useRouter()
  const user = useAuth((s) => s.user)
  const membership = useMembership()
  const complexId = useComplexId()
  const version = useDataVersion((s) => s.version)

  const complex = useMemo(
    () => (complexId ? db.find<Complex & { id: string }>('complexes', complexId) : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [complexId, version],
  )
  const amenities = (complex?.amenities ?? []).filter((a) => a.active)

  const myUnit = useMemo(() => {
    if (!complexId || !membership?.unitId) return undefined
    return db.find<Unit & { id: string }>(db.col(complexId, 'units'), membership.unitId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complexId, membership?.unitId, version])

  const isDelinquent = myUnit?.feeStatus === 'delinquent'

  const [amenityId, setAmenityId] = useState('')
  const [title, setTitle] = useState('')
  const [responsible, setResponsible] = useState(user ? `${user.firstName} ${user.lastName}` : '')
  const [date, setDate] = useState('')
  const [hours, setHours] = useState('')

  const selected = amenities.find((a) => a.id === amenityId)
  const blockedByFee = isDelinquent && !!selected?.blockIfDelinquent

  const canSave =
    !!selected && title.trim() && responsible.trim() &&
    /^\d{4}-\d{2}-\d{2}$/.test(date.trim()) && Number(hours) > 0 && !blockedByFee

  function save() {
    if (!complexId || !user || !selected) return
    const start = new Date(`${date.trim()}T15:00:00`).getTime()
    db.add(db.col(complexId, 'reservations'), {
      residentId: user.id,
      apartmentNumber: membership?.apartmentNumber ?? '',
      title: title.trim(),
      responsibleName: responsible.trim(),
      amenityId: selected.id,
      amenityName: selected.name,
      startDateTime: start,
      endDateTime: start + Number(hours) * 3600_000,
      status: selected.requiresApproval ? 'pending' : 'approved',
    })
    router.back()
  }

  return (
    <Screen title="Nueva Reserva">
      <Text style={s.label}>Zona común</Text>
      <View style={s.amenityGrid}>
        {amenities.map((a) => {
          const locked = isDelinquent && a.blockIfDelinquent
          const on = amenityId === a.id
          return (
            <Pressable
              key={a.id}
              style={[s.amenity, on && s.amenityOn, locked && { opacity: 0.65 }]}
              onPress={() => setAmenityId(a.id)}
            >
              <Icon name={a.icon} size={22} color={on ? colors.primary : colors.textSecondary} />
              <Text style={[s.amenityText, on && { color: colors.primary }]}>{a.name}</Text>
              {locked && (
                <View style={s.lock}>
                  <Icon name="lock-outline" size={12} color={colors.error} />
                </View>
              )}
            </Pressable>
          )
        })}
      </View>

      {blockedByFee && (
        <View style={s.feeWarning}>
          <Icon name="lock-alert-outline" size={20} color="#B91C1C" />
          <View style={{ flex: 1 }}>
            <Text style={s.feeWarningTitle}>Reserva no disponible</Text>
            <Text style={s.feeWarningText}>
              Tu apartamento registra mora en la cuota de administración. Ponte al día con la administración para reservar esta zona.
            </Text>
          </View>
        </View>
      )}

      {selected && !selected.requiresApproval && !blockedByFee && (
        <View style={s.autoNote}>
          <Icon name="flash-outline" size={14} color={colors.success} />
          <Text style={s.autoNoteText}>Esta zona se reserva sin aprobación del administrador</Text>
        </View>
      )}

      <View style={{ gap: 13 }}>
        <Input label="Título" placeholder="Cumpleaños de Sara" value={title} onChangeText={setTitle} />
        <Input label="Responsable" value={responsible} onChangeText={setResponsible} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1.4 }}>
            <Input label="Fecha (AAAA-MM-DD)" placeholder="2026-06-20" value={date} onChangeText={setDate} />
          </View>
          <View style={{ flex: 1 }}>
            <Input label="Horas" placeholder="4" keyboardType="number-pad" value={hours} onChangeText={setHours} />
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
          <Btn variant="secondary" style={{ flex: 1 }} onPress={() => router.back()}>Cancelar</Btn>
          <Btn style={{ flex: 1 }} disabled={!canSave} onPress={save}>Guardar</Btn>
        </View>
      </View>
    </Screen>
  )
}

const s = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 },
  amenityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  amenity: {
    width: '31%', flexGrow: 1, alignItems: 'center', gap: 6,
    backgroundColor: colors.surface, borderRadius: 14,
    paddingVertical: 12, borderWidth: 1.5, borderColor: 'transparent',
    ...shadow.xs,
  },
  amenityOn: { borderColor: colors.primary, backgroundColor: colors.primary10 },
  amenityText: { fontSize: 11.5, fontWeight: '600', color: colors.textSecondary, textAlign: 'center' },
  lock: { position: 'absolute', top: 6, right: 6 },

  feeWarning: {
    flexDirection: 'row', gap: 12,
    backgroundColor: colors.errorSoft, borderRadius: 16,
    padding: 14, marginBottom: 16,
  },
  feeWarningTitle: { fontSize: 13.5, fontWeight: '700', color: '#B91C1C' },
  feeWarningText: { fontSize: 12.5, color: '#B91C1C', lineHeight: 18, marginTop: 2 },

  autoNote: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.successSoft, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8, marginBottom: 16,
  },
  autoNoteText: { fontSize: 12, fontWeight: '500', color: '#15803D' },
})
