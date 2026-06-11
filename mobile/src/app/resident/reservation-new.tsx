import { yupResolver } from '@hookform/resolvers/yup'
import { useRouter } from 'expo-router'
import React, { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { StyleSheet, Text, View } from 'react-native'
import { Btn, Icon, ScalePressable, Screen } from '../../components/ui'
import * as db from '../../data/db'
import { FormDate, FormInput } from '../../forms/fields'
import { reservationSchema, type ReservationForm } from '../../forms/schemas'
import { useDataVersion } from '../../data/version'
import { useAuth, useComplexId, useMembership } from '../../stores/auth'
import { colors, shadow, weight } from '../../theme'
import type { Complex, Unit } from '../../types'

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

  const { control, handleSubmit, watch, setValue, formState } = useForm<ReservationForm>({
    resolver: yupResolver(reservationSchema),
    mode: 'onChange',
    defaultValues: {
      amenityId: '',
      title: '',
      responsible: user ? `${user.firstName} ${user.lastName}` : '',
      date: '',
      hours: '',
    },
  })
  const amenityId = watch('amenityId')

  const selected = amenities.find((a) => a.id === amenityId)
  const blockedByFee = isDelinquent && !!selected?.blockIfDelinquent

  const save = handleSubmit((v) => {
    if (!complexId || !user || !selected || blockedByFee) return
    const start = new Date(`${v.date.trim()}T15:00:00`).getTime()
    db.add(db.col(complexId, 'reservations'), {
      residentId: user.id,
      apartmentNumber: membership?.apartmentNumber ?? '',
      title: v.title.trim(),
      responsibleName: v.responsible.trim(),
      amenityId: selected.id,
      amenityName: selected.name,
      startDateTime: start,
      endDateTime: start + Number(v.hours) * 3600_000,
      status: selected.requiresApproval ? 'pending' : 'approved',
    })
    router.back()
  })

  return (
    <Screen title="Nueva Reserva">
      <Text style={s.label}>Zona común</Text>
      <View style={s.amenityGrid}>
        {amenities.map((a) => {
          const locked = isDelinquent && a.blockIfDelinquent
          const on = amenityId === a.id
          return (
            <View key={a.id} style={s.amenityCell}>
              <ScalePressable
                style={[s.amenity, on && s.amenityOn, locked ? { opacity: 0.65 } : undefined].filter(Boolean) as never}
                scaleTo={0.94}
                onPress={() => setValue('amenityId', a.id, { shouldValidate: true })}
                accessibilityRole="button"
                accessibilityLabel={a.name}
              >
                <Icon name={a.icon} size={22} color={on ? colors.primary : colors.textSecondary} />
                <Text style={[s.amenityText, on && { color: colors.primary }]} numberOfLines={1}>{a.name}</Text>
                {locked && (
                  <View style={s.lock}>
                    <Icon name="lock-outline" size={12} color={colors.error} />
                  </View>
                )}
              </ScalePressable>
            </View>
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
        <FormInput control={control} name="title" label="Título" placeholder="Cumpleaños de Sara" />
        <FormInput control={control} name="responsible" label="Responsable" />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1.5 }}>
            <FormDate control={control} name="date" label="Fecha" />
          </View>
          <View style={{ flex: 1 }}>
            <FormInput control={control} name="hours" label="Horas" placeholder="4" keyboardType="number-pad" />
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
          <Btn variant="secondary" style={{ flex: 1 }} onPress={() => router.back()}>Cancelar</Btn>
          <Btn style={{ flex: 1 }} disabled={!formState.isValid || blockedByFee} onPress={save}>Guardar</Btn>
        </View>
      </View>
    </Screen>
  )
}

const s = StyleSheet.create({
  label: { fontSize: 14, ...weight.semibold, color: colors.textSecondary, marginBottom: 8 },
  /* Grilla 3 columnas: celdas de ancho fijo → todas las tarjetas iguales */
  amenityGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4, marginBottom: 16 },
  amenityCell: { width: '33.33%', padding: 4 },
  amenity: {
    alignItems: 'center', justifyContent: 'center', gap: 6,
    minHeight: 78,
    backgroundColor: colors.surface, borderRadius: 14,
    paddingVertical: 12, paddingHorizontal: 6,
    borderWidth: 1.5, borderColor: 'transparent',
    ...shadow.xs,
  },
  amenityOn: { borderColor: colors.primary, backgroundColor: colors.primary10 },
  amenityText: { fontSize: 12.5, ...weight.semibold, color: colors.textSecondary, textAlign: 'center' },
  lock: { position: 'absolute', top: 6, right: 6 },

  feeWarning: {
    flexDirection: 'row', gap: 12,
    backgroundColor: colors.errorSoft, borderRadius: 16,
    padding: 14, marginBottom: 16,
  },
  feeWarningTitle: { fontSize: 14.5, ...weight.bold, color: '#B91C1C' },
  feeWarningText: { ...weight.regular, fontSize: 13.5, color: '#B91C1C', lineHeight: 18, marginTop: 2 },

  autoNote: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.successSoft, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8, marginBottom: 16,
  },
  autoNoteText: { fontSize: 13, ...weight.medium, color: '#15803D' },
})
