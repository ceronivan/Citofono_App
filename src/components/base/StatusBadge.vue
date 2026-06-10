<script setup lang="ts">
import type { ReservationStatus, MailStatus, TicketStatus } from '@/types'

type Status = ReservationStatus | MailStatus | TicketStatus | 'active'

const props = defineProps<{ status: Status }>()

const cfg: Record<string, { color: string; label: string }> = {
  pending:    { color: 'warning',  label: 'Pendiente' },
  in_review:  { color: 'info',     label: 'En revisión' },
  resolved:   { color: 'success',  label: 'Resuelto' },
  approved:   { color: 'success',  label: 'Aprobado' },
  rejected:   { color: 'error',    label: 'Rechazado' },
  cancelled:  { color: 'error',    label: 'Cancelado' },
  active:     { color: 'success',  label: 'Activo' },
  delivered:  { color: 'info',     label: 'Entregado' },
  confirmed:  { color: 'success',  label: 'Confirmado' },
}
</script>

<template>
  <VChip
    :color="cfg[status]?.color ?? 'grey'"
    variant="tonal"
    size="small"
    class="font-weight-semibold"
  >
    {{ cfg[status]?.label ?? status }}
  </VChip>
</template>
