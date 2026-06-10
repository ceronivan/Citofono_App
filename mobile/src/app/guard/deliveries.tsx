import dayjs from 'dayjs'
import React, { useState } from 'react'
import { Pressable, StyleSheet, Text, Vibration, View } from 'react-native'
import { Btn, EmptyState, Icon, Screen, SectionTitle } from '../../components/ui'
import * as db from '../../data/db'
import { useCollection } from '../../hooks/useCollection'
import { useAuth, useComplexId } from '../../stores/auth'
import { colors, shadow } from '../../theme'
import type { Delivery } from '../../types'

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫']

export default function VerifyDelivery() {
  const user = useAuth((s) => s.user)
  const complexId = useComplexId()
  const expected = useCollection<Delivery>('deliveries', (d) => d.status === 'expected', (a, b) => b.createdAt - a.createdAt)

  const [digits, setDigits] = useState('')
  const [result, setResult] = useState<'idle' | 'match' | 'no-match'>('idle')
  const [matched, setMatched] = useState<Delivery | null>(null)
  const [justDelivered, setJustDelivered] = useState(false)

  function press(key: string) {
    if (key === 'C') return clear()
    if (key === '⌫') {
      setDigits((d) => d.slice(0, -1))
      setResult('idle')
      setMatched(null)
      return
    }
    if (digits.length >= 6 || result === 'match') return
    const next = digits + key
    setDigits(next)
    if (next.length >= 4) {
      const found = expected.find((d) => d.code === next)
      if (found) {
        setMatched(found)
        setResult('match')
        Vibration.vibrate(80)
      } else if (next.length >= 4) {
        setResult(next.length >= 4 && expected.some((d) => d.code.length > next.length) ? 'idle' : 'no-match')
        if (next.length >= 4 && !expected.some((d) => d.code.startsWith(next))) setResult('no-match')
      }
    }
  }

  function clear() {
    setDigits('')
    setResult('idle')
    setMatched(null)
    setJustDelivered(false)
  }

  function confirmDelivery() {
    if (!matched || !complexId || !user) return
    db.update(db.col(complexId, 'deliveries'), matched.id, {
      status: 'delivered',
      deliveredAt: Date.now(),
      deliveredBy: user.id,
    })
    db.add(db.col(complexId, 'notifications'), {
      recipientId: matched.residentId,
      title: '🛵 Domicilio entregado',
      body: `Tu pedido de ${matched.vendor} fue autorizado en portería.`,
      type: 'delivery',
      isRead: false,
    })
    setJustDelivered(true)
    setTimeout(clear, 2600)
  }

  return (
    <Screen title="Verificar domicilio" showBack={false}>
      {justDelivered ? (
        <View style={s.success}>
          <View style={s.successRing}>
            <Icon name="check-bold" size={40} color="#fff" />
          </View>
          <Text style={s.successTitle}>¡Entrega autorizada!</Text>
          <Text style={s.successSub}>
            Apto {matched?.apartmentNumber}{matched?.tower ? ` · ${matched.tower}` : ''} fue notificado
          </Text>
        </View>
      ) : (
        <>
          <View style={[s.display, result === 'match' && s.displayMatch, result === 'no-match' && s.displayError]}>
            <View style={s.dots}>
              {Array.from({ length: Math.max(4, digits.length) }).map((_, i) => (
                <View key={i} style={[s.digit, i < digits.length && s.digitFilled, result === 'match' && i < digits.length && s.digitMatch]}>
                  <Text style={[s.digitText, i < digits.length && { color: result === 'match' ? colors.success : colors.primary }]}>
                    {digits[i] ?? ''}
                  </Text>
                </View>
              ))}
            </View>
            <Text style={[s.hint, result === 'match' && { color: colors.success, fontWeight: '600' }, result === 'no-match' && { color: colors.error, fontWeight: '600' }]}>
              {result === 'no-match'
                ? 'Código no encontrado — pide al repartidor confirmarlo'
                : result === 'match'
                ? '¡Código válido!'
                : 'Ingresa el código que entrega el repartidor'}
            </Text>
          </View>

          {result === 'match' && matched ? (
            <View style={s.matchCard}>
              <View style={s.matchIcon}><Icon name="moped" size={24} color={colors.success} /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.matchVendor}>{matched.vendor}</Text>
                {matched.description ? <Text style={s.matchDesc} numberOfLines={1}>{matched.description}</Text> : null}
                <Text style={s.matchApt}>
                  Apto {matched.apartmentNumber}{matched.tower ? ` · ${matched.tower}` : ''}
                </Text>
              </View>
              <Btn variant="success" onPress={confirmDelivery} style={{ minHeight: 44, paddingHorizontal: 16 }}>
                Autorizar
              </Btn>
            </View>
          ) : (
            <View style={s.pad}>
              {KEYS.map((k) => (
                <Pressable
                  key={k}
                  style={({ pressed }) => [s.key, (k === 'C' || k === '⌫') && s.keyGhost, pressed && { transform: [{ scale: 0.92 }], backgroundColor: colors.primarySoft }]}
                  onPress={() => press(k)}
                >
                  <Text style={[s.keyText, (k === 'C' || k === '⌫') && { color: colors.textSecondary }]}>{k}</Text>
                </Pressable>
              ))}
            </View>
          )}

          <SectionTitle>Domicilios esperados ({expected.length})</SectionTitle>
          {expected.length === 0 ? (
            <EmptyState icon="moped-outline" message="Nadie espera domicilios ahora" />
          ) : (
            <View style={{ gap: 6 }}>
              {expected.map((d) => (
                <View key={d.id} style={s.expItem}>
                  <View style={s.expApt}><Text style={s.expAptText}>{d.apartmentNumber}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.expVendor}>{d.vendor}</Text>
                    <Text style={s.expTime}>{dayjs(d.createdAt).format('h:mm a')}</Text>
                  </View>
                  <Icon name="lock-outline" size={15} color={colors.textDisabled} />
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </Screen>
  )
}

const s = StyleSheet.create({
  display: {
    backgroundColor: colors.surface, borderRadius: 20,
    paddingVertical: 20, paddingHorizontal: 14,
    borderWidth: 2, borderColor: 'transparent',
    alignItems: 'center', marginBottom: 14, ...shadow.xs,
  },
  displayMatch: { borderColor: colors.success, backgroundColor: '#F6FEF9' },
  displayError: { borderColor: colors.error },

  dots: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  digit: {
    width: 44, height: 54, borderRadius: 12,
    backgroundColor: colors.surface2,
    alignItems: 'center', justifyContent: 'center',
  },
  digitFilled: { backgroundColor: colors.primarySoft },
  digitMatch: { backgroundColor: colors.successSoft },
  digitText: { fontSize: 26, fontWeight: '800', color: colors.text },

  hint: { fontSize: 12, color: colors.textSecondary, textAlign: 'center' },

  matchCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1.5, borderColor: colors.success,
    borderRadius: 18, padding: 14, marginBottom: 16, ...shadow.sm,
  },
  matchIcon: {
    width: 46, height: 46, borderRadius: 14,
    backgroundColor: colors.successSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  matchVendor: { fontSize: 14.5, fontWeight: '700', color: colors.text },
  matchDesc: { fontSize: 12, color: colors.textSecondary },
  matchApt: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginTop: 1 },

  pad: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    maxWidth: 280, alignSelf: 'center', marginBottom: 10, justifyContent: 'center',
  },
  key: {
    width: 84, height: 58, borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center', ...shadow.xs,
  },
  keyGhost: { backgroundColor: 'transparent', shadowOpacity: 0, elevation: 0 },
  keyText: { fontSize: 22, fontWeight: '700', color: colors.text },

  success: { alignItems: 'center', paddingVertical: 60 },
  successRing: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: colors.success,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20, ...shadow.md,
  },
  successTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5, color: colors.text },
  successSub: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },

  expItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surface, borderRadius: 13,
    paddingVertical: 10, paddingHorizontal: 14, ...shadow.xs,
  },
  expApt: {
    minWidth: 44, backgroundColor: 'rgba(16,185,129,0.1)',
    borderRadius: 9, paddingVertical: 5, alignItems: 'center',
  },
  expAptText: { fontSize: 14, fontWeight: '800', color: colors.guard },
  expVendor: { fontSize: 13, fontWeight: '600', color: colors.text },
  expTime: { fontSize: 11, color: colors.textTertiary },
})
