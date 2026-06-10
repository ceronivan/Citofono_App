import React from 'react'
import { TicketManage } from '../../components/TicketManage'

export default function AdminPQRs() {
  return (
    <TicketManage
      collection="pqrs"
      title="Gestión de PQRs"
      icon="message-alert-outline"
      emptyMessage="No hay PQRs"
    />
  )
}
