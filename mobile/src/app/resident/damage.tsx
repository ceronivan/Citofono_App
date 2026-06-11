import React from 'react'
import { TicketModule } from '../../components/TicketModule'

export default function DamageReports() {
  return (
    <TicketModule
      collection="damageReports"
      title="Reporte de Daños"
      icon="wrench-outline"
      createLabel="Reportar daño"
      emptyMessage="No has reportado daños"
    />
  )
}
