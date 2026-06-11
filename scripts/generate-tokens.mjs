/**
 * Generador de design tokens — lee tokens.json (fuente única) y escribe:
 *   - src/assets/styles/variables.css   (Vue, rama main y react-native)
 *   - mobile/src/theme.ts               (React Native — solo si mobile/ existe)
 *
 * Uso: npm run tokens
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const t = JSON.parse(readFileSync(join(root, 'tokens.json'), 'utf8'))

const HEADER = 'ARCHIVO GENERADO — no editar a mano. Fuente: tokens.json (raíz). Regenerar con `npm run tokens`.'

// ─── variables.css (Vue) ──────────────────────────────────────────────────────
const c = t.color
const css = `/* ${HEADER} */
:root {
  /* Brand */
  --color-primary: ${c.brand.primary};
  --color-primary-light: ${c.brand.primaryLight};
  --color-primary-soft: ${c.brand.primarySoft};
  --color-primary-10: ${c.brand.primary10};

  /* State */
  --color-success: ${c.state.success};
  --color-success-soft: ${c.state.successSoft};
  --color-warning: ${c.state.warning};
  --color-warning-soft: ${c.state.warningSoft};
  --color-error: ${c.state.error};
  --color-error-soft: ${c.state.errorSoft};
  --color-info: ${c.state.info};
  --color-info-soft: ${c.state.infoSoft};

  /* UI Surfaces */
  --color-bg: ${c.surface.bg};
  --color-surface: ${c.surface.surface};
  --color-surface-2: ${c.surface.surface2};
  --color-border: ${c.surface.border};
  --color-border-light: ${c.surface.borderLight};

  /* Text — secundario/terciario con contraste WCAG AA */
  --color-text-primary: ${c.text.primary};
  --color-text-secondary: ${c.text.secondary};
  --color-text-tertiary: ${c.text.tertiary};
  --color-text-disabled: ${c.text.disabled};

  /* Role accents */
  --color-resident: ${c.role.resident};
  --color-admin: ${c.role.admin};
  --color-guard: ${c.role.guard};

  /* Typography (piso accesible: ${t.font.size.xs}px) */
  --font-family: '${t.font.family}', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --text-xs: ${t.font.size.xs}px;
  --text-sm: ${t.font.size.sm}px;
  --text-base: ${t.font.size.base}px;
  --text-lg: ${t.font.size.lg}px;
  --text-xl: ${t.font.size.xl}px;
  --text-2xl: ${t.font.size['2xl']}px;
  --text-3xl: ${t.font.size['3xl']}px;

  /* Spacing */
${Object.entries(t.spacing).map(([k, v]) => `  --space-${k}: ${v}px;`).join('\n')}

  /* Border radius */
  --radius-sm: ${t.radius.sm}px;
  --radius-md: ${t.radius.md}px;
  --radius-lg: ${t.radius.lg}px;
  --radius-xl: ${t.radius.xl}px;
  --radius-2xl: ${t.radius['2xl']}px;
  --radius-full: ${t.radius.full}px;

  /* Shadows */
  --shadow-xs: ${t.shadow.xs.css};
  --shadow-sm: ${t.shadow.sm.css};
  --shadow-md: ${t.shadow.md.css};
  --shadow-lg: ${t.shadow.lg.css};

  /* Nav */
  --nav-height: ${t.nav.height}px;
}
`
writeFileSync(join(root, 'src/assets/styles/variables.css'), css)
console.log('✓ src/assets/styles/variables.css')

// ─── theme.ts (React Native) ──────────────────────────────────────────────────
const mobileTheme = join(root, 'mobile/src/theme.ts')
if (!existsSync(join(root, 'mobile'))) {
  console.log('· mobile/ no existe en esta rama — se omite theme.ts')
  process.exit(0)
}

const nativeShadow = (s) => `{
    shadowColor: '#000',
    shadowOpacity: ${s.native.opacity},
    shadowRadius: ${s.native.radius},
    shadowOffset: { width: 0, height: ${s.native.offsetY} },
    elevation: ${s.native.elevation},
  }`

const weightName = { regular: '400Regular', medium: '500Medium', semibold: '600SemiBold', bold: '700Bold', extrabold: '800ExtraBold' }

const ts = `/**
 * ${HEADER}
 * Design tokens de PortalResidencial — espejo de src/assets/styles/variables.css.
 */
export const colors = {
  // Brand
  primary: '${c.brand.primary}',
  primaryLight: '${c.brand.primaryLight}',
  primarySoft: '${c.brand.primarySoft}',
  primary10: '${c.brand.primary10}',

  // State
  success: '${c.state.success}',
  successSoft: '${c.state.successSoft}',
  warning: '${c.state.warning}',
  warningSoft: '${c.state.warningSoft}',
  error: '${c.state.error}',
  errorSoft: '${c.state.errorSoft}',
  info: '${c.state.info}',
  infoSoft: '${c.state.infoSoft}',

  // Surfaces
  bg: '${c.surface.bg}',
  surface: '${c.surface.surface}',
  surface2: '${c.surface.surface2}',
  border: '${c.surface.border}',
  borderLight: '${c.surface.borderLight}',

  // Text — secundario/terciario con contraste WCAG AA en texto pequeño
  text: '${c.text.primary}',
  textSecondary: '${c.text.secondary}',
  textTertiary: '${c.text.tertiary}',
  textDisabled: '${c.text.disabled}',

  // Role accents
  resident: '${c.role.resident}',
  admin: '${c.role.admin}',
  guard: '${c.role.guard}',
} as const

export const radius = {
  sm: ${t.radius.sm},
  md: ${t.radius.md},
  lg: ${t.radius.lg},
  xl: ${t.radius.xl},
  xxl: ${t.radius['2xl']},
  full: ${t.radius.full},
} as const

export const spacing = {
  xs: ${t.spacing['1']},
  sm: ${t.spacing['2']},
  md: ${t.spacing['3']},
  lg: ${t.spacing['4']},
  xl: ${t.spacing['5']},
  xxl: ${t.spacing['6']},
} as const

/** Escala tipográfica (piso accesible: ${t.font.size.xs}px). */
export const fontSize = {
  xs: ${t.font.size.xs},
  sm: ${t.font.size.sm},
  base: ${t.font.size.base},
  lg: ${t.font.size.lg},
  xl: ${t.font.size.xl},
  xxl: ${t.font.size['2xl']},
  xxxl: ${t.font.size['3xl']},
} as const

/** Familias ${t.font.family} cargadas con expo-font (ver app/_layout.tsx). */
export const fonts = {
${Object.keys(t.font.weights).map((k) => `  ${k}: '${t.font.family}_${weightName[k]}',`).join('\n')}
} as const

/**
 * Estilo tipográfico por peso. Usar \`...weight.bold\` en lugar de \`fontWeight: '700'\`:
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
${Object.entries(t.roles).map(([k, v]) => `  ${k}: { label: '${v.label}', color: colors.${k}, icon: '${v.icon}' },`).join('\n')}
} as const

export const shadow = {
  xs: ${nativeShadow(t.shadow.xs)},
  sm: ${nativeShadow(t.shadow.sm)},
  md: ${nativeShadow(t.shadow.md)},
  lg: ${nativeShadow(t.shadow.lg)},
} as const
`
writeFileSync(mobileTheme, ts)
console.log('✓ mobile/src/theme.ts')
