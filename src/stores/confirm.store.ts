import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface ConfirmOptions {
  title: string
  message?: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
  icon?: string
}

/**
 * Confirmación global de acciones destructivas (heurística de Nielsen #5,
 * prevención de errores). Uso:
 *
 *   const confirm = useConfirmStore()
 *   if (await confirm.ask({ title: '¿Eliminar vehículo?' })) { ... }
 */
export const useConfirmStore = defineStore('confirm', () => {
  const visible = ref(false)
  const options = ref<Required<ConfirmOptions>>({
    title: '',
    message: '',
    confirmText: 'Eliminar',
    cancelText: 'Cancelar',
    danger: true,
    icon: 'mdi-alert-circle-outline',
  })

  let _resolve: ((value: boolean) => void) | null = null

  function ask(opts: ConfirmOptions): Promise<boolean> {
    options.value = {
      title: opts.title,
      message: opts.message ?? '',
      confirmText: opts.confirmText ?? 'Eliminar',
      cancelText: opts.cancelText ?? 'Cancelar',
      danger: opts.danger ?? true,
      icon: opts.icon ?? (opts.danger === false ? 'mdi-help-circle-outline' : 'mdi-alert-circle-outline'),
    }
    visible.value = true
    return new Promise((resolve) => {
      _resolve = resolve
    })
  }

  function answer(value: boolean) {
    visible.value = false
    _resolve?.(value)
    _resolve = null
  }

  return { visible, options, ask, answer }
})
