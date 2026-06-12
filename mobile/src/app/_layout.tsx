import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/inter'
import dayjs from 'dayjs'
import 'dayjs/locale/es'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import React, { useEffect } from 'react'
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { ConfirmSheet } from '../components/ConfirmSheet'
import { useAuth } from '../stores/auth'
import { colors } from '../theme'

dayjs.locale('es')

/**
 * En web la app vive centrada con ancho de teléfono (igual que la versión Vue);
 * en iOS/Android ocupa la pantalla completa.
 */
function PhoneStage({ children }: { children: React.ReactNode }) {
  if (Platform.OS !== 'web') return <>{children}</>
  return (
    <View style={stage.outer}>
      <View style={stage.phone}>{children}</View>
    </View>
  )
}

const stage = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: '#101016',
    alignItems: 'center',
  },
  phone: {
    flex: 1,
    width: '100%',
    maxWidth: 460,
    backgroundColor: colors.bg,
    overflow: 'hidden',
  },
})

export default function RootLayout() {
  const initialized = useAuth((s) => s.initialized)
  const init = useAuth((s) => s.init)
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  })

  useEffect(() => {
    init()
  }, [init])

  if (!initialized || !fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    )
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <PhoneStage>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: Platform.OS === 'web' ? 'fade' : 'slide_from_right',
            contentStyle: { backgroundColor: colors.bg },
          }}
        />
        <ConfirmSheet />
      </PhoneStage>
    </SafeAreaProvider>
  )
}
