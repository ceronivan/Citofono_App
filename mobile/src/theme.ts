/**
 * ARCHIVO GENERADO — no editar a mano. Fuente: tokens.json (raíz). Regenerar con `npm run tokens`.
 * Design tokens de PortalResidencial — espejo de src/assets/styles/variables.css.
 */
export const colors = {
  // Brand
  primary: '#4F35E8',
  primaryLight: '#7B64F0',
  primarySoft: '#EDE9FF',
  primary10: 'rgba(79, 53, 232, 0.08)',

  // State
  success: '#22C55E',
  successSoft: '#DCFCE7',
  warning: '#F59E0B',
  warningSoft: '#FEF3C7',
  error: '#EF4444',
  errorSoft: '#FEE2E2',
  info: '#3B82F6',
  infoSoft: '#DBEAFE',

  // Surfaces
  bg: '#F8F8FC',
  surface: '#FFFFFF',
  surface2: '#F2F2F7',
  border: '#E5E5EA',
  borderLight: '#F2F2F7',

  // Text — secundario/terciario con contraste WCAG AA en texto pequeño
  text: '#09090B',
  textSecondary: '#5D5D66',
  textTertiary: '#7E7E87',
  textDisabled: '#A8A8B0',

  // Role accents
  resident: '#4F35E8',
  admin: '#0EA5E9',
  guard: '#10B981',
} as const

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  xxl: 32,
  full: 9999,
} as const

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const

/** Escala tipográfica (piso accesible: 12px). */
export const fontSize = {
  xs: 12,
  sm: 13,
  base: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 30,
} as const

/** Familias Inter cargadas con expo-font (ver app/_layout.tsx). */
export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
} as const

/**
 * Estilo tipográfico por peso. Usar `...weight.bold` en lugar de `fontWeight: '700'`:
 * con fuentes cargadas en runtime cada peso es una familia distinta, y mantener
 * fontWeight haría que Android aplique un faux bold encima del archivo ya en negrita.
 */
export const weight = {
  regular: { fontFamily: fonts.regular },
  medium: { fontFamily: fonts.medium },
  semibold: { fontFamily: fonts.semibold },
  bold: { fontFamily: fonts.bold },
  extrabold: { fontFamily: fonts.extrabold },
} as const

export const ROLE_META = {
  resident: { label: 'Residente', color: colors.resident, icon: 'account-outline' },
  admin: { label: 'Admin', color: colors.admin, icon: 'shield-crown-outline' },
  guard: { label: 'Portería', color: colors.guard, icon: 'security' },
} as const

export const shadow = {
  xs: {
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
} as const
