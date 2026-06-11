import React, { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native'
import { Btn, Icon, Input, Screen } from '../../components/ui'
import * as db from '../../data/db'
import { useDataVersion } from '../../data/version'
import { useComplexId } from '../../stores/auth'
import { colors, shadow, weight } from '../../theme'
import type { Amenity, Complex } from '../../types'

export default function Amenities() {
  const complexId = useComplexId()
  const version = useDataVersion((s) => s.version)
  const complex = useMemo(
    () => (complexId ? db.find<Complex & { id: string }>('complexes', complexId) : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [complexId, version],
  )
  const amenities = complex?.amenities ?? []
  const [newName, setNewName] = useState('')

  function save(list: Amenity[]) {
    if (!complexId) return
    db.update('complexes', complexId, { amenities: list })
  }

  function toggle(id: string, field: keyof Amenity) {
    save(amenities.map((a) => (a.id === id ? { ...a, [field]: !a[field] } : a)))
  }

  function addAmenity() {
    const n = newName.trim()
    if (!n) return
    save([...amenities, {
      id: `custom_${Date.now()}`, name: n, icon: 'star-outline',
      requiresApproval: true, blockIfDelinquent: true, active: true,
    }])
    setNewName('')
  }

  return (
    <Screen title="Amenidades">
      <Text style={s.intro}>Configura las zonas comunes del edificio y sus reglas.</Text>
      <View style={{ gap: 10 }}>
        {amenities.map((a) => (
          <View key={a.id} style={[s.card, !a.active && { opacity: 0.55 }]}>
            <View style={s.head}>
              <View style={s.icon}><Icon name={a.icon} size={20} color={colors.primary} /></View>
              <Text style={s.name}>{a.name}</Text>
              <Switch
                value={a.active}
                onValueChange={() => toggle(a.id, 'active')}
                trackColor={{ true: colors.primary }}
              />
            </View>
            {a.active && (
              <View style={s.toggles}>
                <Pressable style={s.toggleRow} onPress={() => toggle(a.id, 'requiresApproval')}>
                  <Icon
                    name={a.requiresApproval ? 'checkbox-marked' : 'checkbox-blank-outline'}
                    size={18}
                    color={a.requiresApproval ? colors.primary : colors.textTertiary}
                  />
                  <Text style={s.toggleText}>Requiere aprobación</Text>
                </Pressable>
                <Pressable style={s.toggleRow} onPress={() => toggle(a.id, 'blockIfDelinquent')}>
                  <Icon
                    name={a.blockIfDelinquent ? 'checkbox-marked' : 'checkbox-blank-outline'}
                    size={18}
                    color={a.blockIfDelinquent ? colors.primary : colors.textTertiary}
                  />
                  <Text style={s.toggleText}>Bloquear en mora</Text>
                </Pressable>
              </View>
            )}
          </View>
        ))}
      </View>

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 14, alignItems: 'flex-end' }}>
        <View style={{ flex: 1 }}>
          <Input label="Nueva amenidad…" value={newName} onChangeText={setNewName} />
        </View>
        <Btn variant="secondary" icon="plus" onPress={addAmenity}>Agregar</Btn>
      </View>
    </Screen>
  )
}

const s = StyleSheet.create({
  intro: { ...weight.regular, fontSize: 14.5, color: colors.textSecondary, marginBottom: 14 },
  card: { backgroundColor: colors.surface, borderRadius: 16, padding: 13, ...shadow.xs },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: {
    width: 38, height: 38, borderRadius: 11,
    backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  name: { flex: 1, fontSize: 14, ...weight.bold, color: colors.text },
  toggles: { flexDirection: 'row', gap: 18, paddingLeft: 48, paddingTop: 8, flexWrap: 'wrap' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  toggleText: { ...weight.regular, fontSize: 13, color: colors.textSecondary },
})
