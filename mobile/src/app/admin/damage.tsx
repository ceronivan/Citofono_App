import React from 'react'
import { TicketManage } from '../../components/TicketManage'

export default function AdminDamage() {
  return (
    <TicketManage
      collection="damageReports"
      title="Reportes de Daños"
      icon="wrench-outline"
      emptyMessage="No hay reportes de daños"
      showBack
    />
  )
}
