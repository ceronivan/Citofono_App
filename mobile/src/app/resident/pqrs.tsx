import React from 'react'
import { TicketModule } from '../../components/TicketModule'

export default function PQRs() {
  return (
    <TicketModule
      collection="pqrs"
      title="Mis PQRs"
      icon="message-alert-outline"
      createLabel="Crear un PQR"
      withCategory
      emptyMessage="No has creado peticiones, quejas ni reclamos"
    />
  )
}
