import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const demoMode = env.VITE_DEMO_MODE === 'true'

  return {
    plugins: [
      vue({ template: { transformAssetUrls } }),
      vuetify({ autoImport: true }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        // ── MODO DEMO ───────────────────────────────────────────────────────
        // Con VITE_DEMO_MODE=true, todo el SDK de Firebase se sustituye por la
        // capa local en src/demo/ (datos dummy en localStorage). Para conectar
        // Firebase real: VITE_DEMO_MODE=false — no hay que tocar ningún store.
        ...(demoMode
          ? {
              'firebase/app': fileURLToPath(new URL('./src/demo/firebase-app.ts', import.meta.url)),
              'firebase/auth': fileURLToPath(new URL('./src/demo/firebase-auth.ts', import.meta.url)),
              'firebase/firestore': fileURLToPath(new URL('./src/demo/firebase-firestore.ts', import.meta.url)),
              'firebase/storage': fileURLToPath(new URL('./src/demo/firebase-storage.ts', import.meta.url)),
            }
          : {}),
      },
    },
  }
})
