<script setup lang="ts">
import { useAuthStore } from '@/stores/auth.store'
const authStore = useAuthStore()
</script>

<template>
  <div class="device-stage">
    <!-- Caption visible solo en escritorio -->
    <div class="device-caption" aria-hidden="true">
      <div class="device-caption-logo">
        <VIcon icon="mdi-shield-home" size="22" color="white" />
      </div>
      <h1>PortalResidencial</h1>
      <p>Vista previa móvil · 390 px</p>
      <span class="device-caption-hint">El MVP corre como app web instalable y queda listo para empaquetarse con Capacitor (Android / iOS).</span>
    </div>

    <div class="device-frame">
      <div class="device-screen">
        <div class="device-notch" aria-hidden="true" />
        <VApp>
          <VProgressLinear v-if="authStore.loading" indeterminate color="primary" />
          <RouterView v-else />
          <ConfirmDialog />
        </VApp>
      </div>
    </div>
  </div>
</template>

<style>
/* ── Móvil real: sin marco ─────────────────────────────────────────────────── */
.device-stage { min-height: 100dvh; }
.device-caption { display: none; }
.device-notch { display: none; }
/* Ancla de overlays (Vuetify attach) en ambos modos */
.device-screen { position: relative; }

/* ── Escritorio: la app vive dentro de un teléfono ─────────────────────────── */
@media (min-width: 880px) and (min-height: 560px) {
  :root {
    --frame-h: min(872px, calc(100dvh - 48px));
    --screen-h: calc(var(--frame-h) - 22px);
  }

  body { overflow: hidden; }

  .device-stage {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 64px;
    min-height: 100dvh;
    background:
      radial-gradient(ellipse 800px 600px at 70% 20%, rgba(79, 53, 232, 0.16), transparent 60%),
      radial-gradient(ellipse 600px 500px at 20% 85%, rgba(14, 165, 233, 0.10), transparent 60%),
      linear-gradient(160deg, #0E0E13 0%, #16121F 100%);
    padding: 24px;
  }

  .device-caption {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    max-width: 300px;
  }

  .device-caption-logo {
    width: 46px; height: 46px;
    background: linear-gradient(135deg, #4F35E8, #7B64F0);
    border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 16px;
    box-shadow: 0 8px 28px rgba(79, 53, 232, 0.45);
  }

  .device-caption h1 {
    font-size: 26px; font-weight: 800; letter-spacing: -0.6px;
    color: white; margin: 0 0 4px;
  }
  .device-caption p {
    font-size: 14px; font-weight: 600;
    color: rgba(255, 255, 255, 0.55); margin: 0 0 16px;
  }
  .device-caption-hint {
    font-size: 12.5px; line-height: 1.6;
    color: rgba(255, 255, 255, 0.4);
  }

  .device-frame {
    width: 408px;
    height: var(--frame-h);
    background: linear-gradient(160deg, #2A2A30, #111114);
    border-radius: 56px;
    padding: 11px;
    box-shadow:
      0 40px 80px rgba(0, 0, 0, 0.55),
      0 0 0 1.5px rgba(255, 255, 255, 0.09),
      inset 0 0 4px rgba(255, 255, 255, 0.08);
    flex-shrink: 0;
  }

  .device-screen {
    position: relative;
    height: 100%;
    border-radius: 45px;
    overflow: hidden;
    background: var(--color-bg);
    /* El transform hace que los position:fixed internos se anclen al teléfono */
    transform: translateZ(0);
  }

  .device-notch {
    display: block;
    position: fixed;
    top: 10px; left: 50%;
    transform: translateX(-50%);
    width: 110px; height: 28px;
    background: #0A0A0C;
    border-radius: 9999px;
    z-index: 9999;
    pointer-events: none;
  }

  /* La app scrollea dentro de la pantalla */
  .device-screen .v-application {
    max-width: none;
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
  }
  .device-screen .v-application__wrap { min-height: 100%; }

  /* Las vistas con min-height:100dvh se ajustan a la pantalla del teléfono */
  .device-screen .resident-shell,
  .device-screen .admin-shell,
  .device-screen .guard-shell,
  .device-screen .dashboard,
  .device-screen .login-shell,
  .device-screen .reg-shell,
  .device-screen .wizard {
    min-height: var(--screen-h) !important;
  }
  .device-screen .resident-main,
  .device-screen .admin-main,
  .device-screen .guard-main {
    min-height: auto !important;
  }

  /* Espacio para el Dynamic Island — emula env(safe-area-inset-top) del
     dispositivo real. !important: los estilos scoped de cada componente
     (padding: 0 20px) van después en la cascada y lo pisarían. */
  .device-screen .dash-header-inner,
  .device-screen .admin-header-inner,
  .device-screen .guard-header-inner {
    padding-top: 44px !important;
    height: auto !important;
    padding-bottom: 8px !important;
  }
  .device-screen .wiz-header,
  .device-screen .reg-header,
  .device-screen .screen-header-bar {
    padding-top: 44px !important;
  }
  /* Hero del login: baja el logo para no chocar con la isla */
  .device-screen .login-brand {
    padding-top: 40px;
  }
}
</style>
