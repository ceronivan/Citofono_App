<template>
  <div>
    <ScreenHeader title="Mis Visitas" />
    <VContainer class="py-4">
      <VRow>
        <VCol cols="6">
          <VCard to="/visits/pedestrian" rounded="lg" border elevation="0" hover class="pa-4 text-center">
            <VIcon icon="mdi-walk" size="36" color="primary" class="mb-2" />
            <div class="text-body-2 font-weight-medium">Peatonales</div>
          </VCard>
        </VCol>
        <VCol cols="6">
          <VCard to="/visits/vehicle" rounded="lg" border elevation="0" hover class="pa-4 text-center">
            <VIcon icon="mdi-car-outline" size="36" color="primary" class="mb-2" />
            <div class="text-body-2 font-weight-medium">Vehículos</div>
          </VCard>
        </VCol>
      </VRow>
    </VContainer>
  </div>
</template>
