/**
 * Selector de fecha WEB — usa el <input type="date"> nativo del navegador
 * (en móvil web abre el picker del sistema operativo).
 */
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { colors } from '../theme'

export function DateField({
  label,
  value,
  onChange,
}: {
  label?: string
  value: string // YYYY-MM-DD
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <View style={{ gap: 6 }}>
      {label && <Text style={s.label}>{label}</Text>}
      {React.createElement('input', {
        type: 'date',
        value,
        onChange: (e: { target: { value: string } }) => onChange(e.target.value),
        style: {
          minHeight: 52,
          borderRadius: 14,
          border: `1.5px solid ${colors.border}`,
          backgroundColor: colors.surface,
          padding: '0 14px',
          fontSize: 16,
          color: value ? colors.text : colors.textDisabled,
          fontFamily: 'inherit',
          outline: 'none',
          width: '100%',
          boxSizing: 'border-box',
        },
      })}
    </View>
  )
}

const s = StyleSheet.create({
  label: { fontSize: 14, fontWeight: '600', color: colors.text },
})
