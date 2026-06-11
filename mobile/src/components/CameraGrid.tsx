import { useVideoPlayer, VideoView } from 'expo-video'
import React, { useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { Camera } from '../types'
import { colors, weight } from '../theme'
import { Icon } from './ui'

function CameraTile({ cam, manage, onEdit, onRemove }: {
  cam: Camera
  manage?: boolean
  onEdit?: (c: Camera) => void
  onRemove?: (c: Camera) => void
}) {
  const player = useVideoPlayer(cam.active && cam.streamUrl ? cam.streamUrl : null, (p) => {
    p.loop = true
    p.muted = true
    p.play()
  })

  const [clock, setClock] = useState('')
  useEffect(() => {
    const fmt = () =>
      setClock(new Date().toLocaleString('es-CO', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
      }))
    fmt()
    const t = setInterval(fmt, 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <View style={s.tile}>
      {cam.active && cam.streamUrl ? (
        <VideoView player={player} style={s.video} contentFit="cover" nativeControls={false} />
      ) : (
        <View style={s.offline}>
          <Icon name="video-off-outline" size={26} color="#52525B" />
          <Text style={s.offlineText}>Sin señal</Text>
        </View>
      )}

      {cam.active && (
        <View style={s.overlay} pointerEvents="none">
          <View style={s.overlayTop}>
            <View style={s.rec}>
              <View style={s.recDot} />
              <Text style={s.recText}>REC</Text>
            </View>
            <Text style={s.clock}>{clock}</Text>
          </View>
          <View>
            <Text style={s.name}>{cam.name}</Text>
            <Text style={s.location}>{cam.location}</Text>
          </View>
        </View>
      )}

      {manage && (
        <View style={s.actions}>
          <Pressable style={s.action} onPress={() => onEdit?.(cam)}>
            <Icon name="pencil-outline" size={14} color={colors.text} />
          </Pressable>
          <Pressable style={s.action} onPress={() => onRemove?.(cam)}>
            <Icon name="delete-outline" size={14} color={colors.error} />
          </Pressable>
        </View>
      )}
    </View>
  )
}

export function CameraGrid({ cameras, manage, onEdit, onRemove }: {
  cameras: Camera[]
  manage?: boolean
  onEdit?: (c: Camera) => void
  onRemove?: (c: Camera) => void
}) {
  return (
    <View style={s.grid}>
      {cameras.map((c) => (
        <CameraTile key={c.id} cam={c} manage={manage} onEdit={onEdit} onRemove={onRemove} />
      ))}
    </View>
  )
}

const s = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: {
    width: '48%', aspectRatio: 16 / 10,
    borderRadius: 16, overflow: 'hidden',
    backgroundColor: '#0A0A0F', flexGrow: 1,
  },
  video: { width: '100%', height: '100%' },
  offline: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#111114',
  },
  offlineText: { fontSize: 12, ...weight.semibold, color: '#52525B' },

  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    padding: 9,
    justifyContent: 'space-between',
  },
  overlayTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rec: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  recDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444' },
  recText: { fontSize: 9, ...weight.extrabold, letterSpacing: 1, color: '#fff' },
  clock: { fontSize: 8.5, ...weight.semibold, color: 'rgba(255,255,255,0.85)' },

  name: { fontSize: 13, ...weight.extrabold, color: '#fff' },
  location: { ...weight.regular, fontSize: 12, color: 'rgba(255,255,255,0.7)' },

  actions: { position: 'absolute', top: 8, right: 8, flexDirection: 'row', gap: 6 },
  action: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center', justifyContent: 'center',
  },
})
