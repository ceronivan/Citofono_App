import React, { useState } from 'react'
import { StyleSheet, Switch, Text, View } from 'react-native'
import { CameraGrid } from '../../components/CameraGrid'
import { BottomSheet, Btn, EmptyState, Icon, Input, Screen } from '../../components/ui'
import * as db from '../../data/db'
import { useCollection } from '../../hooks/useCollection'
import { useComplexId } from '../../stores/auth'
import { confirmAsk } from '../../stores/confirm'
import { colors } from '../../theme'
import type { Camera } from '../../types'

const DEMO_STREAMS = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
]

export default function AdminCameras() {
  const complexId = useComplexId()
  const cameras = useCollection<Camera>('cameras', undefined, (a, b) => a.name.localeCompare(b.name))

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Camera | null>(null)
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [streamUrl, setStreamUrl] = useState('')
  const [active, setActive] = useState(true)

  function openCreate() {
    setEditing(null)
    setName(''); setLocation('')
    setStreamUrl(DEMO_STREAMS[cameras.length % DEMO_STREAMS.length])
    setActive(true)
    setOpen(true)
  }

  function openEdit(cam: Camera) {
    setEditing(cam)
    setName(cam.name); setLocation(cam.location)
    setStreamUrl(cam.streamUrl); setActive(cam.active)
    setOpen(true)
  }

  function save() {
    if (!complexId) return
    const payload = { name: name.trim(), location: location.trim(), streamUrl: streamUrl.trim(), active }
    if (editing) db.update(db.col(complexId, 'cameras'), editing.id, payload)
    else db.add(db.col(complexId, 'cameras'), payload)
    setOpen(false)
  }

  async function remove(cam: Camera) {
    const ok = await confirmAsk({
      title: '¿Eliminar cámara?',
      message: `${cam.name} (${cam.location}) se quitará del monitoreo.`,
    })
    if (ok && complexId) db.remove(db.col(complexId, 'cameras'), cam.id)
  }

  return (
    <Screen title="Cámaras de seguridad">
      <View style={s.banner}>
        <Icon name="information-outline" size={16} color="#1D4ED8" />
        <Text style={s.bannerText}>
          Vista de demostración — los streams reales del CCTV se conectan al configurar el hardware del edificio.
        </Text>
      </View>
      <Btn icon="plus" onPress={openCreate} style={{ marginBottom: 16 }}>Agregar cámara</Btn>

      {cameras.length === 0 ? (
        <EmptyState icon="cctv" message="No hay cámaras configuradas" />
      ) : (
        <CameraGrid cameras={cameras} manage onEdit={openEdit} onRemove={remove} />
      )}

      <BottomSheet visible={open} onClose={() => setOpen(false)} title={editing ? 'Editar cámara' : 'Nueva cámara'}>
        <View style={{ gap: 12 }}>
          <Input label="Nombre" placeholder="CAM 01 — Lobby" value={name} onChangeText={setName} />
          <Input label="Ubicación" placeholder="Entrada principal" value={location} onChangeText={setLocation} />
          <Input label="URL del stream (MP4/HLS)" value={streamUrl} onChangeText={setStreamUrl} autoCapitalize="none" />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 14, color: colors.text }}>Cámara activa</Text>
            <Switch value={active} onValueChange={setActive} trackColor={{ true: colors.primary }} />
          </View>
          <Btn disabled={!name.trim() || !streamUrl.trim()} onPress={save}>Guardar</Btn>
        </View>
      </BottomSheet>
    </Screen>
  )
}

const s = StyleSheet.create({
  banner: {
    flexDirection: 'row', gap: 8,
    backgroundColor: colors.infoSoft, borderRadius: 12,
    padding: 12, marginBottom: 14,
  },
  bannerText: { flex: 1, fontSize: 12, lineHeight: 17, color: '#1D4ED8' },
})
