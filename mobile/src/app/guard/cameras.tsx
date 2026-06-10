import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { CameraGrid } from '../../components/CameraGrid'
import { EmptyState, Screen } from '../../components/ui'
import { useCollection } from '../../hooks/useCollection'
import { colors } from '../../theme'
import type { Camera } from '../../types'

export default function GuardCameras() {
  const cameras = useCollection<Camera>('cameras', undefined, (a, b) => a.name.localeCompare(b.name))
  const active = cameras.filter((c) => c.active).length

  return (
    <Screen title="Cámaras" showBack={false}>
      <View style={s.status}>
        <View style={s.dot} />
        <Text style={s.statusText}>
          <Text style={{ fontWeight: '700', color: colors.text }}>{active}</Text> de {cameras.length} cámaras en línea
        </Text>
      </View>
      {cameras.length === 0 ? (
        <EmptyState icon="cctv" message="El administrador aún no configura cámaras" />
      ) : (
        <CameraGrid cameras={cameras} />
      )}
    </Screen>
  )
}

const s = StyleSheet.create({
  status: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.guard },
  statusText: { fontSize: 13, color: colors.textSecondary },
})
