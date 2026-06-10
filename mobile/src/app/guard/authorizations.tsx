import dayjs from 'dayjs'
import React, { useState } from 'react'
import { View } from 'react-native'
import { Btn, EmptyState, Input, ListRow, Screen, StatusChip } from '../../components/ui'
import { useCollection } from '../../hooks/useCollection'
import { colors } from '../../theme'
import type { Authorization } from '../../types'

export default function CheckAuthorizations() {
  const [apt, setApt] = useState('')
  const [searched, setSearched] = useState('')
  const items = useCollection<Authorization>(
    'authorizations',
    (a) => !!searched && a.apartmentNumber === searched && a.validUntil > Date.now(),
  )

  return (
    <Screen title="Consultar Autorizaciones">
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end', marginBottom: 16 }}>
        <View style={{ flex: 1 }}>
          <Input label="Número de apto" placeholder="101" keyboardType="number-pad" value={apt} onChangeText={setApt} />
        </View>
        <Btn variant="success" icon="magnify" onPress={() => setSearched(apt.trim())}>Buscar</Btn>
      </View>

      {!searched ? (
        <EmptyState icon="shield-account-outline" message="Busca un apartamento para ver sus autorizaciones activas" />
      ) : items.length === 0 ? (
        <EmptyState icon="shield-off-outline" message={`El apto ${searched} no tiene autorizaciones activas`} />
      ) : (
        <View style={{ gap: 10 }}>
          {items.map((a) => (
            <ListRow
              key={a.id}
              icon="account-check-outline"
              iconBg={colors.successSoft}
              iconColor={colors.success}
              title={`${a.person.firstName} ${a.person.lastName}`}
              subtitle={`CC ${a.person.idNumber}`}
              meta={`Válida hasta ${dayjs(a.validUntil).format('D MMM YYYY')}`}
              right={<StatusChip status="approved" label="Autorizada" />}
            />
          ))}
        </View>
      )}
    </Screen>
  )
}
