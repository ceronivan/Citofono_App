import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

export default createVuetify({
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: { mdi },
  },
  theme: {
    defaultTheme: 'portalTheme',
    themes: {
      portalTheme: {
        dark: false,
        colors: {
          primary: '#4F35E8',
          secondary: '#7B64F0',
          success: '#22C55E',
          warning: '#F59E0B',
          error: '#EF4444',
          info: '#3B82F6',
          background: '#F8F8FC',
          surface: '#FFFFFF',
        },
      },
    },
  },
  defaults: {
    // Los overlays se montan dentro de la pantalla del teléfono (vista escritorio)
    VDialog: {
      attach: '.device-screen',
      contained: true,
    },
    VBottomSheet: {
      attach: '.device-screen',
      contained: true,
    },
    VMenu: {
      attach: '.device-screen',
    },
    VTextField: {
      variant: 'outlined',
      density: 'comfortable',
      rounded: 'lg',
      color: 'primary',
    },
    VSelect: {
      variant: 'outlined',
      density: 'comfortable',
      rounded: 'lg',
      color: 'primary',
    },
    VTextarea: {
      variant: 'outlined',
      density: 'comfortable',
      rounded: 'lg',
      color: 'primary',
    },
    VBtn: {
      rounded: 'pill',
      style: 'text-transform: none; letter-spacing: 0; font-weight: 600;',
    },
    VCard: {
      rounded: 'xl',
      elevation: 0,
    },
    VChip: {
      rounded: 'pill',
    },
    VAlert: {
      rounded: 'xl',
    },
    VSnackbar: {
      rounded: 'xl',
    },
    VList: {
      rounded: 'xl',
    },
    VSheet: {
      rounded: 'xl',
    },
  },
})
