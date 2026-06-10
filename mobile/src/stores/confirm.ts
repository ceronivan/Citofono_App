import { create } from 'zustand'

export interface ConfirmOptions {
  title: string
  message?: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
}

interface ConfirmState {
  visible: boolean
  options: Required<ConfirmOptions>
  ask: (opts: ConfirmOptions) => Promise<boolean>
  answer: (value: boolean) => void
}

let _resolve: ((v: boolean) => void) | null = null

/**
 * Confirmación global de acciones destructivas (Nielsen #5).
 *   const ok = await useConfirm.getState().ask({ title: '¿Eliminar?' })
 */
export const useConfirm = create<ConfirmState>()((set) => ({
  visible: false,
  options: { title: '', message: '', confirmText: 'Eliminar', cancelText: 'Cancelar', danger: true },

  ask(opts) {
    set({
      visible: true,
      options: {
        title: opts.title,
        message: opts.message ?? '',
        confirmText: opts.confirmText ?? 'Eliminar',
        cancelText: opts.cancelText ?? 'Cancelar',
        danger: opts.danger ?? true,
      },
    })
    return new Promise<boolean>((resolve) => {
      _resolve = resolve
    })
  },

  answer(value) {
    set({ visible: false })
    _resolve?.(value)
    _resolve = null
  },
}))

export const confirmAsk = (opts: ConfirmOptions) => useConfirm.getState().ask(opts)
