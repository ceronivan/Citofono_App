import React from 'react'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { useConfirm } from '../stores/confirm'
import { colors } from '../theme'
import { Icon } from './ui'

/** Diálogo global de confirmación — montado una vez en el layout raíz. */
export function ConfirmSheet() {
  const { visible, options, answer } = useConfirm()
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => answer(false)}>
      <View style={s.backdrop}>
        <View style={s.card}>
          <View style={[s.icon, { backgroundColor: options.danger ? colors.errorSoft : colors.primarySoft }]}>
            <Icon
              name={options.danger ? 'alert-circle-outline' : 'help-circle-outline'}
              size={26}
              color={options.danger ? colors.error : colors.primary}
            />
          </View>
          <Text style={s.title}>{options.title}</Text>
          {options.message ? <Text style={s.message}>{options.message}</Text> : null}
          <View style={s.actions}>
            <Pressable
              style={({ pressed }) => [s.btn, s.btnCancel, pressed && s.pressed]}
              onPress={() => answer(false)}
            >
              <Text style={s.btnCancelText}>{options.cancelText}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                s.btn,
                { backgroundColor: options.danger ? colors.error : colors.primary },
                pressed && s.pressed,
              ]}
              onPress={() => answer(true)}
            >
              <Text style={s.btnConfirmText}>{options.confirmText}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center', padding: 28,
  },
  card: {
    backgroundColor: colors.surface, borderRadius: 24,
    padding: 22, width: '100%', maxWidth: 340, alignItems: 'center',
  },
  icon: {
    width: 56, height: 56, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  title: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3, color: colors.text, textAlign: 'center' },
  message: { fontSize: 14.5, color: colors.textSecondary, lineHeight: 20, textAlign: 'center', marginTop: 4 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 18, alignSelf: 'stretch' },
  btn: {
    flex: 1, minHeight: 48, borderRadius: 9999,
    alignItems: 'center', justifyContent: 'center',
  },
  btnCancel: { backgroundColor: colors.surface2 },
  btnCancelText: { fontSize: 14, fontWeight: '700', color: colors.text },
  btnConfirmText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  pressed: { transform: [{ scale: 0.97 }] },
})
