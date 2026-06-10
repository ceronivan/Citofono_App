/**
 * Mock de 'firebase/app' para el modo DEMO.
 */
export function initializeApp(_config: Record<string, unknown>) {
  console.info(
    '%c🎭 PortalResidencial — MODO DEMO activo (datos locales, sin Firebase). ' +
    'Cuentas: admin@demo.com · residente@demo.com · portero@demo.com (cualquier contraseña). ' +
    'Reset: __demoReset()',
    'color:#4F35E8;font-weight:bold',
  )
  return { __mock: 'app' }
}

export default { initializeApp }
