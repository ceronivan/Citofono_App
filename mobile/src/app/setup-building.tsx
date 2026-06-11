import { useRouter } from 'expo-router'
import React, { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Btn, Icon, Input, Screen } from '../components/ui'
import * as db from '../data/db'
import { useAuth } from '../stores/auth'
import { colors, shadow } from '../theme'
import type { Amenity } from '../types'

interface TowerConfig { name: string; floors: string; unitsPerFloor: string }

const AMENITY_PRESETS: (Amenity & { selected: boolean })[] = [
  { id: 'social_room', name: 'Salón Social', icon: 'party-popper', requiresApproval: true, blockIfDelinquent: true, active: true, selected: true },
  { id: 'pool', name: 'Piscina', icon: 'pool', requiresApproval: true, blockIfDelinquent: true, active: true, selected: true },
  { id: 'bbq', name: 'Zona BBQ', icon: 'grill-outline', requiresApproval: true, blockIfDelinquent: true, active: true, selected: false },
  { id: 'gym', name: 'Gimnasio', icon: 'dumbbell', requiresApproval: false, blockIfDelinquent: true, active: true, selected: false },
  { id: 'court', name: 'Cancha', icon: 'basketball', requiresApproval: true, blockIfDelinquent: true, active: true, selected: false },
  { id: 'coworking', name: 'Coworking', icon: 'laptop', requiresApproval: false, blockIfDelinquent: true, active: true, selected: false },
]

const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

export default function SetupBuilding() {
  const router = useRouter()
  const user = useAuth((s) => s.user)
  const addMembership = useAuth((s) => s.addMembership)

  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [towers, setTowers] = useState<TowerConfig[]>([{ name: 'Torre A', floors: '5', unitsPerFloor: '2' }])
  const [amenities, setAmenities] = useState(AMENITY_PRESETS)
  const [inviteCode, setInviteCode] = useState('')

  const totalUnits = towers.reduce((sum, t) => sum + (Number(t.floors) || 0) * (Number(t.unitsPerFloor) || 0), 0)
  const selectedAmenities = amenities.filter((a) => a.selected)

  const canNext =
    step === 1 ? name.trim().length >= 3 && address.trim().length >= 3 && city.trim().length >= 2
    : step === 2 ? towers.length > 0 && totalUnits > 0 && totalUnits <= 2000
    : selectedAmenities.length > 0

  function create() {
    if (!user) return
    const complex = db.add('complexes', {
      name: name.trim(), address: address.trim(), city: city.trim(),
      towers: towers.map((t) => t.name.trim()),
      amenities: selectedAmenities.map(({ selected: _s, ...a }) => a),
      createdBy: user.id,
    })

    for (const t of towers) {
      const floors = Number(t.floors) || 0
      const upf = Number(t.unitsPerFloor) || 0
      for (let floor = 1; floor <= floors; floor++) {
        for (let u = 1; u <= upf; u++) {
          const number = `${floor}${String(u).padStart(2, '0')}`
          db.add(db.col(complex.id, 'units'), {
            id: `${t.name.trim().replace(/\s+/g, '-')}_${number}`.toLowerCase(),
            tower: t.name.trim(), number,
            label: towers.length > 1 ? `${t.name.trim()} · ${number}` : number,
            ownerIds: [], ownerNames: [], feeStatus: 'current',
          })
        }
      }
    }

    const prefix = name.trim().split(/\s+/).filter((w) => w.length > 2)[0]?.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5) || 'PORTAL'
    let rnd = ''
    for (let i = 0; i < 4; i++) rnd += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
    const code = `${prefix}-${rnd}`
    db.add('invites', {
      id: code, complexId: complex.id, complexName: name.trim(),
      towers: towers.map((t) => t.name.trim()), role: 'resident',
      maxUses: 0, usedCount: 0, active: true, createdBy: user.id,
    })

    addMembership({ complexId: complex.id, complexName: name.trim(), role: 'admin' })
    setInviteCode(code)
    setStep(4)
  }

  return (
    <Screen title={step === 4 ? '' : 'Crear edificio'} showBack={step !== 4}>
      {step === 1 && (
        <View style={{ gap: 14 }}>
          <Text style={s.emoji}>🏢</Text>
          <Text style={s.title}>Tu edificio</Text>
          <Text style={s.sub}>Información básica del conjunto residencial</Text>
          <Input label="Nombre del conjunto" placeholder="Conjunto El Prado" value={name} onChangeText={setName} />
          <Input label="Dirección" placeholder="Calle 123 # 45-67" value={address} onChangeText={setAddress} />
          <Input label="Ciudad" placeholder="Bogotá" value={city} onChangeText={setCity} />
        </View>
      )}

      {step === 2 && (
        <View style={{ gap: 12 }}>
          <Text style={s.emoji}>🗼</Text>
          <Text style={s.title}>Torres y apartamentos</Text>
          <Text style={s.sub}>Los números se generan como piso + apto (ej: 501)</Text>
          {towers.map((t, i) => (
            <View key={i} style={s.towerCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Input value={t.name} onChangeText={(v) => setTowers(towers.map((x, j) => (j === i ? { ...x, name: v } : x)))} />
                </View>
                {towers.length > 1 && (
                  <Pressable onPress={() => setTowers(towers.filter((_, j) => j !== i))} hitSlop={8}>
                    <Icon name="close-circle" size={22} color={colors.error} />
                  </Pressable>
                )}
              </View>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                <View style={{ flex: 1 }}>
                  <Input label="Pisos" keyboardType="number-pad" value={t.floors} onChangeText={(v) => setTowers(towers.map((x, j) => (j === i ? { ...x, floors: v } : x)))} />
                </View>
                <View style={{ flex: 1 }}>
                  <Input label="Aptos por piso" keyboardType="number-pad" value={t.unitsPerFloor} onChangeText={(v) => setTowers(towers.map((x, j) => (j === i ? { ...x, unitsPerFloor: v } : x)))} />
                </View>
              </View>
            </View>
          ))}
          <Btn variant="secondary" icon="plus" onPress={() => setTowers([...towers, { name: `Torre ${'ABCDEFGHIJ'[towers.length] ?? towers.length + 1}`, floors: '5', unitsPerFloor: '2' }])}>
            Agregar torre
          </Btn>
          <Text style={s.total}>{totalUnits} apartamentos en total</Text>
        </View>
      )}

      {step === 3 && (
        <View style={{ gap: 12 }}>
          <Text style={s.emoji}>🏊</Text>
          <Text style={s.title}>Amenidades</Text>
          <Text style={s.sub}>Selecciona las zonas comunes del edificio</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {amenities.map((a) => (
              <Pressable
                key={a.id}
                style={[s.amenity, a.selected && s.amenityOn]}
                onPress={() => setAmenities(amenities.map((x) => (x.id === a.id ? { ...x, selected: !x.selected } : x)))}
              >
                <Icon name={a.icon} size={18} color={a.selected ? colors.primary : colors.textSecondary} />
                <Text style={[s.amenityText, a.selected && { color: colors.primary }]}>{a.name}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {step === 4 && (
        <View style={{ alignItems: 'center', paddingTop: 40 }}>
          <View style={s.successRing}><Icon name="check" size={42} color="#fff" /></View>
          <Text style={[s.title, { textAlign: 'center' }]}>¡Edificio creado!</Text>
          <Text style={[s.sub, { textAlign: 'center' }]}>
            Comparte este código con los propietarios para que se registren
          </Text>
          <View style={s.codeBox}>
            <Text style={s.code}>{inviteCode}</Text>
          </View>
          <Btn onPress={() => router.replace('/admin' as never)} style={{ alignSelf: 'stretch', marginTop: 24 }}>
            Ir a mi edificio
          </Btn>
        </View>
      )}

      {step < 4 && (
        <View style={{ marginTop: 24 }}>
          {step < 3 ? (
            <Btn disabled={!canNext} onPress={() => setStep(step + 1)}>Continuar</Btn>
          ) : (
            <Btn disabled={!canNext} onPress={create}>Crear edificio ({totalUnits} aptos)</Btn>
          )}
          {step > 1 && (
            <Btn variant="secondary" onPress={() => setStep(step - 1)} style={{ marginTop: 10 }}>Atrás</Btn>
          )}
        </View>
      )}
    </Screen>
  )
}

const s = StyleSheet.create({
  emoji: { fontSize: 40 },
  title: { fontSize: 26, fontWeight: '800', letterSpacing: -0.6, color: colors.text },
  sub: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: 8 },

  towerCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 14, ...shadow.xs },
  total: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginTop: 4 },

  amenity: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.surface, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1.5, borderColor: 'transparent', ...shadow.xs,
  },
  amenityOn: { borderColor: colors.primary, backgroundColor: colors.primary10 },
  amenityText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },

  successRing: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: colors.success,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20, ...shadow.md,
  },
  codeBox: {
    marginTop: 20, paddingVertical: 18, paddingHorizontal: 32,
    backgroundColor: colors.surface,
    borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.primary,
    borderRadius: 18, alignSelf: 'stretch', alignItems: 'center',
  },
  code: { fontSize: 26, fontWeight: '800', letterSpacing: 3, color: colors.primary },
})
