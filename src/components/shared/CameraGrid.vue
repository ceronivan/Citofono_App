<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { Camera } from '@/types'

defineProps<{
  cameras: Camera[]
  manage?: boolean
}>()

const emit = defineEmits<{
  edit: [camera: Camera]
  remove: [camera: Camera]
}>()

const expanded = ref<string | null>(null)

// Reloj del overlay tipo CCTV
const now = ref(new Date())
let timer: ReturnType<typeof setInterval>
onMounted(() => {
  timer = setInterval(() => (now.value = new Date()), 1000)
})
onUnmounted(() => clearInterval(timer))

function fmtClock(d: Date) {
  return d.toLocaleString('es-CO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  })
}
</script>

<template>
  <div class="cam-grid">
    <div
      v-for="(cam, i) in cameras"
      :key="cam.id"
      class="cam-tile"
      :class="{ 'cam-tile--expanded': expanded === cam.id, 'cam-tile--off': !cam.active }"
      :style="{ animationDelay: `${i * 60}ms` }"
      @click="expanded = expanded === cam.id ? null : cam.id"
    >
      <div class="cam-video-wrap">
        <video
          v-if="cam.active"
          :src="cam.streamUrl"
          autoplay
          muted
          loop
          playsinline
          class="cam-video"
        />
        <div v-else class="cam-offline">
          <VIcon icon="mdi-video-off-outline" size="28" />
          <span>Sin señal</span>
        </div>

        <!-- Overlay CCTV -->
        <div v-if="cam.active" class="cam-overlay">
          <div class="cam-overlay-top">
            <span class="cam-rec"><span class="cam-rec-dot" /> REC</span>
            <span class="cam-clock">{{ fmtClock(now) }}</span>
          </div>
          <div class="cam-overlay-bottom">
            <span class="cam-name">{{ cam.name }}</span>
            <span class="cam-location">{{ cam.location }}</span>
          </div>
        </div>

        <!-- Acciones admin -->
        <div v-if="manage" class="cam-actions" @click.stop>
          <button class="cam-action" @click="emit('edit', cam)">
            <VIcon icon="mdi-pencil-outline" size="15" />
          </button>
          <button class="cam-action cam-action--danger" @click="emit('remove', cam)">
            <VIcon icon="mdi-delete-outline" size="15" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cam-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.cam-tile {
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  background: #0A0A0F;
  box-shadow: var(--shadow-sm);
  transition: all 0.25s ease;
  animation: cam-in 0.4s ease both;
}

@keyframes cam-in {
  from { opacity: 0; transform: scale(0.96); }
  to { opacity: 1; transform: scale(1); }
}

.cam-tile--expanded { grid-column: span 2; }
.cam-tile--off { opacity: 0.8; }

.cam-video-wrap { position: relative; aspect-ratio: 16/10; }
.cam-tile--expanded .cam-video-wrap { aspect-ratio: 16/9; }

.cam-video {
  width: 100%; height: 100%;
  object-fit: cover;
  display: block;
  filter: saturate(0.85) contrast(1.05);
}

.cam-offline {
  width: 100%; height: 100%;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px;
  color: #52525B; font-size: 11px; font-weight: 600;
  background: repeating-linear-gradient(45deg, #111114, #111114 8px, #16161A 8px, #16161A 16px);
}

.cam-overlay {
  position: absolute; inset: 0;
  display: flex; flex-direction: column; justify-content: space-between;
  padding: 8px 10px;
  background: linear-gradient(rgba(0,0,0,0.35), transparent 30%, transparent 65%, rgba(0,0,0,0.55));
  pointer-events: none;
}

.cam-overlay-top { display: flex; justify-content: space-between; align-items: center; }

.cam-rec {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 9px; font-weight: 800; letter-spacing: 1px;
  color: white;
}
.cam-rec-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #EF4444;
  animation: rec-blink 1.4s ease infinite;
}
@keyframes rec-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.2; } }

.cam-clock {
  font-size: 8.5px; font-weight: 600;
  color: rgba(255,255,255,0.85);
  font-variant-numeric: tabular-nums;
  font-family: 'Courier New', monospace;
}

.cam-overlay-bottom { display: flex; flex-direction: column; }
.cam-name { font-size: 12px; font-weight: 800; color: white; letter-spacing: -0.2px; }
.cam-location { font-size: 10px; color: rgba(255,255,255,0.7); }

.cam-actions {
  position: absolute; top: 8px; right: 8px;
  display: flex; gap: 6px;
}
.cam-action {
  width: 28px; height: 28px; border: none; border-radius: 50%;
  background: rgba(255,255,255,0.92); color: var(--color-text-primary);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: transform 0.12s ease;
}
.cam-action:active { transform: scale(0.88); }
.cam-action--danger { color: var(--color-error); }
</style>
