/**
 * Selector de fecha NATIVO (iOS/Android) — usa el picker del sistema.
 * La versión web (DateField.web.tsx) usa <input type="date">.
 */
import DateTimePicker from '@react-native-community/datetimepicker'
import dayjs from 'dayjs'
import React, { useState } from 'react'
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { colors, weight } from '../theme'
import { Icon } from './ui'

export function DateField({
  label,
  value,
  onChange,
  placeholder = 'Seleccionar fecha',
  error,
}: {
  label?: string
  value: string // YYYY-MM-DD
  onChange: (v: string) => void
  placeholder?: string
  error?: string
}) {
  const [show, setShow] = useState(false)
  const date = value ? new Date(`${value}T12:00:00`) : new Date()

  return (
    <View style={{ gap: 6 }}>
      {label && <Text style={s.label}>{label}</Text>}
      <Pressable
        style={[s.field, error ? { borderColor: colors.error } : null]}
        onPress={() => setShow(true)}
        accessibilityRole="button"
        accessibilityLabel={label ?? 'Fecha'}
      >
        <Text style={{ ...weight.regular, fontSize: 16, color: value ? colors.text : colors.textDisabled }}>
          {value ? dayjs(date).format('D [de] MMMM, YYYY') : placeholder}
        </Text>
        <Icon name="calendar-outline" size={18} color={colors.textTertiary} />
      </Pressable>
      {error ? <Text style={s.error}>{error}</Text> : null}
      {show && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={(_event, selected) => {
            setShow(Platform.OS === 'ios')
            if (selected) onChange(dayjs(selected).format('YYYY-MM-DD'))
          }}
        />
      )}
    </View>
  )
}

const s = StyleSheet.create({
  label: { fontSize: 14, ...weight.semibold, color: colors.text },
  error: { fontSize: 12.5, ...weight.medium, color: colors.error },
  field: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
})
