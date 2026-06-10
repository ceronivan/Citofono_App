<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useMailStore } from '@/stores/mail.store'
import { useResidentLookup } from '@/composables/useResidentLookup'
import type { MailType, User } from '@/types'

const store = useMailStore()
const { findByApartment } = useResidentLookup()

const loading = ref(false)
const success = ref(false)
const photo = ref<File | null>(null)
const photoPreview = ref<string | null>(null)

const lookingUp = ref(false)
const resident = ref<User | null>(null)
const residentNotFound = ref(false)

const form = ref({
  apartmentNumber: '',
  description: '',
  type: 'package' as MailType,
  sender: '',
})

const mailTypes = [
  { value: 'package', title: 'Paquete', icon: 'mdi-package-variant-closed', bg: '#FEF3C7', color: '#D97706' },
  { value: 'letter',  title: 'Carta',   icon: 'mdi-email-outline',          bg: '#DBEAFE', color: '#2563EB' },
  { value: 'document',title: 'Documento',icon: 'mdi-file-document-outline', bg: '#E0E7FF', color: '#4338CA' },
  { value: 'other',   title: 'Otro',    icon: 'mdi-inbox-outline',          bg: '#F3F4F6', color: '#6B7280' },
]

let lookupTimeout: ReturnType<typeof setTimeout>

watch(() => form.value.apartmentNumber, (apt) => {
  resident.value = null
  residentNotFound.value = false
  clearTimeout(lookupTimeout)
  if (apt.trim().length < 1) return
  lookupTimeout = setTimeout(async () => {
    lookingUp.value = true
    try {
      const found = await findByApartment(apt.trim())
      resident.value = found
      residentNotFound.value = !found
    } finally {
      lookingUp.value = false
    }
  }, 600)
})

function onPhotoChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0] ?? null
  photo.value = file
  photoPreview.value = file ? URL.createObjectURL(file) : null
}

async function handleRegister() {
  if (!photo.value || !resident.value) return
  loading.value = true
  try {
    await store.register(
      form.value.apartmentNumber,
      resident.value.id,
      form.value.description,
      form.value.type,
      photo.value,
      form.value.sender,
    )
    success.value = true
    form.value = { apartmentNumber: '', description: '', type: 'package', sender: '' }
    photo.value = null
    photoPreview.value = null
    resident.value = null
  } finally {
    loading.value = false
  }
}

const canSubmit = computed(() => !!photo.value && !!resident.value)

const selectedType = computed(() => mailTypes.find(t => t.value === form.value.type))
</script>

<template>
  <div class="register-screen">
    <ScreenHeader title="Registrar correspondencia" />

    <div class="register-body">

      <!-- Success banner -->
      <div v-if="success" class="success-banner">
        <VIcon icon="mdi-check-circle" size="20" color="#16A34A" />
        <span>Correspondencia registrada correctamente</span>
        <button class="banner-close" @click="success = false">
          <VIcon icon="mdi-close" size="16" />
        </button>
      </div>

      <!-- ── Apartamento ── -->
      <div class="form-section">
        <p class="form-section-label">Apartamento</p>
        <div class="field-wrap" :class="{ 'field-wrap--loading': lookingUp, 'field-wrap--ok': !!resident }">
          <VIcon icon="mdi-door" size="18" class="field-icon" />
          <input
            v-model="form.apartmentNumber"
            type="text"
            inputmode="numeric"
            placeholder="Ej: 501"
            class="field-input"
          />
          <div v-if="lookingUp" class="field-spinner" />
          <VIcon v-else-if="resident" icon="mdi-check-circle" size="18" color="#16A34A" />
          <VIcon v-else-if="residentNotFound" icon="mdi-alert-circle" size="18" color="#EF4444" />
        </div>

        <!-- Resident found -->
        <div v-if="resident" class="resident-found">
          <div class="resident-avatar">
            {{ resident.firstName?.[0] }}{{ resident.lastName?.[0] }}
          </div>
          <div>
            <p class="resident-name">{{ resident.firstName }} {{ resident.lastName }}</p>
            <p class="resident-apt">Apto {{ resident.apartmentNumber }}</p>
          </div>
        </div>

        <!-- Not found -->
        <div v-if="residentNotFound" class="resident-not-found">
          <VIcon icon="mdi-alert-circle-outline" size="15" />
          No hay residente registrado en el apto {{ form.apartmentNumber }}
        </div>
      </div>

      <!-- ── Tipo ── -->
      <div class="form-section">
        <p class="form-section-label">Tipo de correspondencia</p>
        <div class="type-grid">
          <button
            v-for="t in mailTypes"
            :key="t.value"
            class="type-btn"
            :class="{ 'type-btn--active': form.value === t.value }"
            :style="form.type === t.value ? { borderColor: t.color, background: t.bg } : {}"
            @click="form.type = t.value as MailType"
          >
            <div class="type-icon" :style="{ background: t.bg }">
              <VIcon :icon="t.icon" size="18" :color="t.color" />
            </div>
            <span class="type-label" :style="form.type === t.value ? { color: t.color } : {}">{{ t.title }}</span>
          </button>
        </div>
      </div>

      <!-- ── Descripción ── -->
      <div class="form-section">
        <p class="form-section-label">Descripción</p>
        <div class="field-wrap">
          <VIcon icon="mdi-text-short" size="18" class="field-icon" />
          <input
            v-model="form.description"
            type="text"
            placeholder="Ej: Paquete de Amazon"
            class="field-input"
          />
        </div>
      </div>

      <!-- ── Remitente ── -->
      <div class="form-section">
        <p class="form-section-label">Remitente <span class="optional-tag">opcional</span></p>
        <div class="field-wrap">
          <VIcon icon="mdi-store-outline" size="18" class="field-icon" />
          <input
            v-model="form.sender"
            type="text"
            placeholder="Ej: DHL, Amazon, FedEx"
            class="field-input"
          />
        </div>
      </div>

      <!-- ── Foto ── -->
      <div class="form-section">
        <p class="form-section-label">Foto del paquete</p>
        <input ref="mailPhoto" type="file" accept="image/*" capture="environment" style="display:none" @change="onPhotoChange" />

        <button
          v-if="!photoPreview"
          class="photo-btn"
          @click="($refs.mailPhoto as HTMLElement).click()"
        >
          <div class="photo-btn-icon">
            <VIcon icon="mdi-camera-outline" size="28" color="#A1A1AA" />
          </div>
          <span class="photo-btn-label">Tomar foto</span>
          <span class="photo-btn-sub">Requerido para registrar</span>
        </button>

        <div v-else class="photo-preview-wrap">
          <img :src="photoPreview" class="photo-preview" alt="Foto del paquete" />
          <button
            class="photo-retake"
            @click="($refs.mailPhoto as HTMLElement).click()"
          >
            <VIcon icon="mdi-camera-retake-outline" size="16" />
            Retomar
          </button>
        </div>
      </div>

      <!-- ── Submit ── -->
      <button
        class="submit-btn"
        :disabled="!canSubmit || loading"
        @click="handleRegister"
      >
        <span v-if="!loading">
          <VIcon icon="mdi-check-circle-outline" size="18" />
          Registrar correspondencia
        </span>
        <span v-else class="btn-spinner" />
      </button>

    </div>
  </div>
</template>

<style scoped>
.register-screen {
  min-height: 100dvh;
  background: var(--color-bg);
}

.register-body {
  padding: 8px 16px 40px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Success banner */
.success-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #DCFCE7;
  border-radius: 14px;
  padding: 12px 14px;
  font-size: 13px;
  font-weight: 600;
  color: #15803D;
}
.success-banner span { flex: 1; }
.banner-close {
  border: none;
  background: none;
  cursor: pointer;
  color: #15803D;
  opacity: 0.6;
  display: flex;
  align-items: center;
  padding: 0;
}

/* Form sections */
.form-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-section-label {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-secondary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.optional-tag {
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-tertiary);
  background: var(--color-surface-2);
  border-radius: 9999px;
  padding: 1px 8px;
}

/* Field */
.field-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--color-surface);
  border-radius: 14px;
  padding: 0 14px;
  height: 52px;
  border: 1.5px solid var(--color-border);
  box-shadow: var(--shadow-xs);
  transition: border-color 0.15s;
}
.field-wrap:focus-within { border-color: var(--color-guard); }
.field-wrap--ok { border-color: #22C55E; }
.field-wrap--loading { border-color: var(--color-border); }

.field-icon { color: var(--color-text-tertiary); flex-shrink: 0; }

.field-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 15px;
  font-family: inherit;
  color: var(--color-text-primary);
  outline: none;
  min-width: 0;
}
.field-input::placeholder { color: var(--color-text-tertiary); }

.field-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-guard);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}

/* Resident status */
.resident-found {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #F0FDF4;
  border-radius: 12px;
  padding: 10px 12px;
}

.resident-avatar {
  width: 36px;
  height: 36px;
  background: #22C55E;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
}

.resident-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.resident-apt {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin: 0;
}

.resident-not-found {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #FEF2F2;
  color: #DC2626;
  border-radius: 12px;
  padding: 10px 12px;
  font-size: 13px;
  font-weight: 500;
}

/* Type selector */
.type-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.type-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 10px 4px;
  background: var(--color-surface);
  border: 1.5px solid var(--color-border);
  border-radius: 14px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}

.type-icon {
  width: 38px;
  height: 38px;
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.type-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-secondary);
  transition: color 0.15s;
}

/* Photo */
.photo-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  width: 100%;
  background: var(--color-surface);
  border: 2px dashed var(--color-border);
  border-radius: 18px;
  padding: 24px 16px;
  cursor: pointer;
  transition: border-color 0.15s;
}
.photo-btn:active { border-color: var(--color-guard); }

.photo-btn-icon {
  width: 56px;
  height: 56px;
  background: var(--color-surface-2);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}

.photo-btn-label {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.photo-btn-sub {
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.photo-preview-wrap {
  position: relative;
}

.photo-preview {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 18px;
  display: block;
}

.photo-retake {
  position: absolute;
  bottom: 10px;
  right: 10px;
  display: flex;
  align-items: center;
  gap: 5px;
  background: rgba(0,0,0,0.65);
  color: white;
  border: none;
  border-radius: 9999px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  backdrop-filter: blur(4px);
}

/* Submit */
.submit-btn {
  width: 100%;
  height: 54px;
  border: none;
  border-radius: 9999px;
  background: var(--color-guard);
  color: white;
  font-size: 15px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 4px;
  transition: opacity 0.15s, transform 0.12s;
}
.submit-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
.submit-btn:not(:disabled):active { transform: scale(0.98); opacity: 0.9; }

.btn-spinner {
  width: 18px;
  height: 18px;
  border: 2.5px solid rgba(255,255,255,0.4);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: block;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
