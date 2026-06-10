/**
 * Kit de componentes base — port del design system de la versión Vue.
 */
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React from 'react'
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, radius, shadow } from '../theme'

type IconName = keyof typeof MaterialCommunityIcons.glyphMap

export const Icon = ({ name, size = 20, color = colors.text }: { name: string; size?: number; color?: string }) => (
  <MaterialCommunityIcons name={name as IconName} size={size} color={color} />
)

// ─── Pantalla con header ──────────────────────────────────────────────────────
export function Screen({
  title,
  children,
  showBack = true,
  right,
  scroll = true,
  padded = true,
}: {
  title?: string
  children: React.ReactNode
  showBack?: boolean
  right?: React.ReactNode
  scroll?: boolean
  padded?: boolean
}) {
  const insets = useSafeAreaInsets()
  const body = padded ? <View style={s.body}>{children}</View> : <>{children}</>
  return (
    <View style={[s.screen, { paddingTop: insets.top }]}>
      {title !== undefined && (
        <View style={s.header}>
          {showBack ? <BackBtn /> : <View style={{ width: 36 }} />}
          <Text style={s.headerTitle} numberOfLines={1}>{title}</Text>
          <View style={s.headerRight}>{right ?? <View style={{ width: 36 }} />}</View>
        </View>
      )}
      {scroll ? (
        <ScrollView contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
          {body}
        </ScrollView>
      ) : (
        body
      )}
    </View>
  )
}

export function BackBtn() {
  const router = useRouter()
  return (
    <Pressable
      style={({ pressed }) => [s.backBtn, pressed && s.pressed]}
      onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      accessibilityLabel="Atrás"
    >
      <Icon name="arrow-left" size={20} />
    </Pressable>
  )
}

// ─── Botones ──────────────────────────────────────────────────────────────────
export function Btn({
  children,
  onPress,
  variant = 'primary',
  icon,
  loading,
  disabled,
  style,
}: {
  children: React.ReactNode
  onPress?: () => void
  variant?: 'primary' | 'secondary' | 'danger' | 'success'
  icon?: string
  loading?: boolean
  disabled?: boolean
  style?: ViewStyle
}) {
  const bg =
    variant === 'primary' ? colors.primary
    : variant === 'danger' ? colors.error
    : variant === 'success' ? colors.success
    : colors.primarySoft
  const fg = variant === 'secondary' ? colors.primary : '#fff'
  return (
    <Pressable
      style={({ pressed }) => [
        s.btn,
        { backgroundColor: bg, opacity: disabled || loading ? 0.5 : pressed ? 0.85 : 1 },
        pressed && !disabled && s.pressed,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon && <Icon name={icon} size={18} color={fg} />}
          <Text style={[s.btnText, { color: fg }]}>{children}</Text>
        </>
      )}
    </Pressable>
  )
}

// ─── Inputs ───────────────────────────────────────────────────────────────────
export function Input({
  label,
  style,
  ...props
}: TextInputProps & { label?: string }) {
  return (
    <View style={{ gap: 6 }}>
      {label && <Text style={s.inputLabel}>{label}</Text>}
      <TextInput
        placeholderTextColor={colors.textDisabled}
        style={[s.input, style]}
        {...props}
      />
    </View>
  )
}

export function SelectSheet<T extends string>({
  label,
  value,
  options,
  onChange,
  placeholder = 'Seleccionar…',
}: {
  label?: string
  value: T | ''
  options: { value: T; title: string; icon?: string }[]
  onChange: (v: T) => void
  placeholder?: string
}) {
  const [open, setOpen] = React.useState(false)
  const current = options.find((o) => o.value === value)
  return (
    <View style={{ gap: 6 }}>
      {label && <Text style={s.inputLabel}>{label}</Text>}
      <Pressable style={[s.input, s.selectField]} onPress={() => setOpen(true)}>
        <Text style={{ color: current ? colors.text : colors.textDisabled, fontSize: 15 }}>
          {current?.title ?? placeholder}
        </Text>
        <Icon name="chevron-down" size={18} color={colors.textTertiary} />
      </Pressable>
      <BottomSheet visible={open} onClose={() => setOpen(false)} title={label ?? 'Seleccionar'}>
        {options.map((o) => (
          <Pressable
            key={o.value}
            style={({ pressed }) => [s.sheetOption, o.value === value && s.sheetOptionActive, pressed && s.pressed]}
            onPress={() => { onChange(o.value); setOpen(false) }}
          >
            {o.icon && <Icon name={o.icon} size={18} color={o.value === value ? colors.primary : colors.textSecondary} />}
            <Text style={[s.sheetOptionText, o.value === value && { color: colors.primary, fontWeight: '700' }]}>
              {o.title}
            </Text>
            {o.value === value && <Icon name="check" size={18} color={colors.primary} />}
          </Pressable>
        ))}
      </BottomSheet>
    </View>
  )
}

// ─── Bottom sheet genérico ────────────────────────────────────────────────────
export function BottomSheet({
  visible,
  onClose,
  title,
  children,
}: {
  visible: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}) {
  const insets = useSafeAreaInsets()
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.sheetBackdrop} onPress={onClose} />
      <View style={[s.sheet, { paddingBottom: Math.max(20, insets.bottom) }]}>
        <View style={s.sheetHandle} />
        {title && <Text style={s.sheetTitle}>{title}</Text>}
        <ScrollView style={{ maxHeight: 480 }} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </View>
    </Modal>
  )
}

// ─── Tarjetas y filas ─────────────────────────────────────────────────────────
export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[s.card, style]}>{children}</View>
}

export function ListRow({
  icon,
  iconColor = colors.primary,
  iconBg = colors.primarySoft,
  title,
  subtitle,
  meta,
  right,
  onPress,
}: {
  icon: string
  iconColor?: string
  iconBg?: string
  title: string
  subtitle?: string
  meta?: string
  right?: React.ReactNode
  onPress?: () => void
}) {
  return (
    <Pressable
      style={({ pressed }) => [s.row, pressed && onPress ? s.pressed : null]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[s.rowIcon, { backgroundColor: iconBg }]}>
        <Icon name={icon} size={22} color={iconColor} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={s.rowTitle} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={s.rowSubtitle} numberOfLines={2}>{subtitle}</Text> : null}
        {meta ? <Text style={s.rowMeta}>{meta}</Text> : null}
      </View>
      {right}
    </Pressable>
  )
}

// ─── Chips de estado ──────────────────────────────────────────────────────────
const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pendiente', color: '#B45309', bg: colors.warningSoft },
  approved: { label: 'Aprobada', color: '#15803D', bg: colors.successSoft },
  rejected: { label: 'Rechazada', color: '#B91C1C', bg: colors.errorSoft },
  cancelled: { label: 'Cancelada', color: colors.textSecondary, bg: colors.surface2 },
  in_review: { label: 'En revisión', color: '#1D4ED8', bg: colors.infoSoft },
  resolved: { label: 'Resuelto', color: '#15803D', bg: colors.successSoft },
  expected: { label: 'En camino', color: '#B45309', bg: colors.warningSoft },
  delivered: { label: 'Entregado', color: '#15803D', bg: colors.successSoft },
  confirmed: { label: 'Confirmado', color: '#15803D', bg: colors.successSoft },
  scheduled: { label: 'Programado', color: '#1D4ED8', bg: colors.infoSoft },
  in_progress: { label: 'En curso', color: '#B45309', bg: colors.warningSoft },
  completed: { label: 'Completado', color: '#15803D', bg: colors.successSoft },
  current: { label: 'Al día', color: '#15803D', bg: colors.successSoft },
  delinquent: { label: 'En mora', color: '#B91C1C', bg: colors.errorSoft },
}

export function StatusChip({ status, label }: { status: string; label?: string }) {
  const meta = STATUS_META[status] ?? { label: status, color: colors.textSecondary, bg: colors.surface2 }
  return (
    <View style={[s.chip, { backgroundColor: meta.bg }]}>
      <Text style={[s.chipText, { color: meta.color }]}>{label ?? meta.label}</Text>
    </View>
  )
}

// ─── Estados vacíos / carga ───────────────────────────────────────────────────
export function EmptyState({ icon, message }: { icon: string; message: string }) {
  return (
    <View style={s.empty}>
      <View style={s.emptyIcon}>
        <Icon name={icon} size={30} color={colors.textTertiary} />
      </View>
      <Text style={s.emptyText}>{message}</Text>
    </View>
  )
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <Text style={s.sectionTitle}>{children}</Text>
}

export function Avatar({ url, size = 44, icon = 'account-outline' }: { url?: string; size?: number; icon?: string }) {
  return url ? (
    <Image source={{ uri: url }} style={{ width: size, height: size, borderRadius: size / 2 }} />
  ) : (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={icon} size={size * 0.5} color={colors.textDisabled} />
    </View>
  )
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  body: { paddingHorizontal: 20, paddingTop: 8 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 52,
    gap: 8,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
  },
  headerRight: { minWidth: 36, alignItems: 'flex-end' },

  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.surface2,
    alignItems: 'center', justifyContent: 'center',
  },
  pressed: { transform: [{ scale: 0.95 }] },

  btn: {
    minHeight: 52,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
  },
  btnText: { fontSize: 15, fontWeight: '700', letterSpacing: -0.1 },

  inputLabel: { fontSize: 13, fontWeight: '600', color: colors.text },
  input: {
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    fontSize: 15,
    color: colors.text,
  },
  selectField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: colors.border, alignSelf: 'center', marginBottom: 12,
  },
  sheetTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.4, color: colors.text, marginBottom: 12 },
  sheetOption: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, paddingHorizontal: 8,
    borderRadius: 12,
  },
  sheetOptionActive: { backgroundColor: colors.primary10 },
  sheetOptionText: { flex: 1, fontSize: 15, color: colors.text },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 16,
    ...shadow.xs,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 13,
    ...shadow.xs,
  },
  rowIcon: {
    width: 44, height: 44, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
  },
  rowTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  rowSubtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  rowMeta: { fontSize: 11, color: colors.textTertiary, marginTop: 2 },

  chip: {
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  chipText: { fontSize: 11, fontWeight: '700' },

  empty: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center',
  },
  emptyText: { fontSize: 13.5, color: colors.textSecondary, textAlign: 'center', maxWidth: 240 },

  sectionTitle: {
    fontSize: 12, fontWeight: '700', color: colors.textTertiary,
    textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10, marginTop: 18,
  },
})
