import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import React, { useEffect } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { ConfirmSheet } from '../components/ConfirmSheet'
import { useAuth } from '../stores/auth'
import { colors } from '../theme'

export default function RootLayout() {
  const initialized = useAuth((s) => s.initialized)
  const init = useAuth((s) => s.init)

  useEffect(() => {
    init()
  }, [init])

  if (!initialized) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    )
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />
      <ConfirmSheet />
    </SafeAreaProvider>
  )
}
