import { create } from 'zustand'

/**
 * Contador de versión de datos: cada escritura en la base demo lo incrementa,
 * y las pantallas que leen colecciones se re-renderizan.
 */
interface DataVersionState {
  version: number
  bump: () => void
}

export const useDataVersion = create<DataVersionState>()((set) => ({
  version: 0,
  bump: () => set((s) => ({ version: s.version + 1 })),
}))

export function bumpDataVersion() {
  useDataVersion.getState().bump()
}
