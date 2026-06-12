# PortalResidencial — Entregable de sesión

**Fecha:** 12 de junio de 2026
**Repositorio:** https://github.com/ceronivan/Citofono_App
**Ramas:** `main` (Vue 3) · `react-native` (Expo — iOS / Android / Web)

---

## 1. Resumen ejecutivo

En esta sesión la rama `react-native` pasó de ser un port con paridad visual a una app con **arquitectura de producto**: fuente única de design tokens compartida con Vue, tipografía Inter real, formularios con validación de esquemas (react-hook-form + yup), un **modelo de roles propietario/habitante por unidad**, y un **módulo de Facturación/Contabilidad** que reemplaza las tablas de Excel del administrador (cuotas, gastos, multas cruzadas, reportes y CSV).

Ambas versiones siguen funcionando en **modo demo** (datos dummy persistentes, sin Firebase) con la arquitectura intercambiable de siempre.

**Cuentas demo** (cualquier contraseña):
`admin@demo.com` · `portero@demo.com` · `residente@demo.com` (propietario que habita) · `propietario@demo.com` (dueño que **no** habita, Torre B 101) · `habitante@demo.com` (arrendatario de Torre B 101)

**Códigos de domicilio activos:** `4821` (Pizza) · `7350` (Mercado) · **Códigos de invitación:** `PRADO-DEMO` (propietario) · `PRADO-HABITA` (habitante)

---

## 2. Trabajo realizado en esta sesión

### 2.1 Design tokens unificados (Fase A — ambas ramas)
- **`tokens.json` en la raíz** como fuente única de verdad + `scripts/generate-tokens.mjs` (`npm run tokens`) que regenera `src/assets/styles/variables.css` (Vue) y `mobile/src/theme.ts` (RN). Un cambio de color/espaciado se propaga a las dos apps.
- Divergencias resueltas a favor de la versión accesible: grises de texto con **contraste WCAG AA** (`#5D5D66`/`#7E7E87`/`#A8A8B0`) ahora también en Vue, piso tipográfico de **12 px**, `radius 2xl` y `shadow lg` disponibles en ambas plataformas.
- **Tipografía Inter en RN** con `expo-font` (`@expo-google-fonts/inter`): cada peso es una familia (`weight.regular…extrabold` en el theme — evita el *faux bold* de Android) aplicada en el kit UI y las ~35 pantallas. En Vue, `--font-family` quedó tokenizado.
- Réplica de la parte Vue en la rama `main` (commit `bc04213`).

### 2.2 Tab bar flotante con paridad Vue (Fase B.1)
- Nuevo `components/tabBar.tsx`: píldora blanca (radio 26, sombra `0 4px 24px`) **elevada del borde con safe area** (`max(16px, inset)`) — ya no se corta en dispositivos con home indicator.
- Ícono activo con el tinte del rol al 8 % (igual que el `.nav-item--active` de Vue); los 3 layouts (residente/admin/portería) consumen el mismo helper compartido.

### 2.3 Formularios: react-hook-form + yup
- **`mobile/src/forms/schemas.ts`**: todos los esquemas de validación centralizados (15+) con mensajes en español; los condicionales usan `when()` (placa solo para vehículo, torre/apto solo residente, valor solo en multas…).
- **`mobile/src/forms/fields.tsx`**: `FormInput` / `FormSelect` / `FormDate` conectan el kit UI con `<Controller>`; el error del esquema aparece bajo el campo (borde rojo + mensaje) al tocarlo o tras un submit.
- **12 pantallas migradas** de `useState` a `useForm` (login, registro, domicilios, vehículos, autorizaciones, reservas, PQRs/daños, visitas, correspondencia, publicar, mantenimientos, cámaras): botón deshabilitado por `formState.isValid`, `reset()` al guardar, UI idéntica.

### 2.4 Roles: propietario vs. habitante por unidad (Fase D del roadmap anterior)
- `Membership.residentType`: **`owner_resident`** (propietario que habita) · **`owner`** (propietario que no habita) · **`tenant`** (habitante/arrendatario). Datos v1 sin el campo = `owner_resident` (sin migración disruptiva). `Unit` separa `ownerIds` de `tenantIds`.
- **Permisos**:
  - *Ambos*: mantenimientos, circulares, noticias, PQRs, reportar daños, multas/llamados de su unidad y edición del propio perfil.
  - *Solo quien habita*: domicilios, correspondencia, visitas, autorizaciones (ahora también de **vehículo temporal** con placa y vigencia) y reservas (tab oculta para el dueño que no habita).
  - *Solo propietario*: registro de **vehículos de la unidad** (el habitante los ve en solo lectura).
  - Los **reportes de daños** son visibles por toda la unidad (dueño + habitante); los PQRs siguen siendo personales.
- El dashboard del residente filtra módulos según el tipo y muestra el chip correspondiente (Propietario residente / Propietario / Habitante); el admin elige el tipo al crear códigos de invitación y el registro reclama la unidad como dueño o habitante.
- **Módulo de multas y llamados de atención**: el admin emite multa (valor + estado pendiente/pagada/anulada) o llamado de atención dirigido a una unidad, con notificación automática a dueños y habitantes.

### 2.5 Módulo Facturación/Contabilidad (reemplazo del Excel)
- **Cuotas** (`data/billing.ts` + pantalla `admin/billing`): cuota base configurable por edificio + **ajustes por unidad** (ej. penthouses); al generar el periodo se **cruzan automáticamente las multas pendientes** de cada unidad como ítems de su cuota (sin doble cobro). Pago con medio (transferencia/efectivo/otro) y fecha; al pagar, las multas incluidas quedan saldadas.
- **Mora automática**: la cartera de morosos se deriva de cuotas vencidas sin pagar — ya no se marca a mano; el bloqueo de reservas por mora sigue funcionando sobre ese estado.
- **Gastos**: registro de pagos a proveedores/servicios contratados por categoría (vigilancia, aseo, mantenimiento, servicios públicos, jardinería, seguros…).
- **Reportes**: resumen mensual (recaudado, gastos, saldo, % de recaudo, mora), gastos por categoría con barras, evolución ingresos vs. gastos de los últimos 6 meses y **exportación CSV** del periodo (Excel/contador).
- **Multas archivables**: el botón "Eliminar" se reemplazó por **"Archivar"** — la sanción sale de las vistas activas pero su registro se conserva en contabilidad.
- **Estado de cuenta del residente** (propietario y habitante): saldo pendiente o "al día", cada cuota con su detalle de conceptos y forma/fecha de pago.
- dayjs en español para toda la app; semilla v3 con 2 periodos de cuotas, gastos de proveedores y cuotas diferenciadas.

### 2.6 Cómo correr cada versión
```bash
# Vue (rama main) — la app vive en src/ de la raíz; requiere .env.local con VITE_DEMO_MODE=true
npm install && npm run dev                       # http://localhost:5173

# React Native (rama react-native)
cd mobile && npm install
npm run web      # navegador
npm start        # QR para Expo Go en el teléfono
```

---

## 3. Pasos a seguir (roadmap propuesto)

### Fase B — Refinamiento de UI (continuación)
1. **Refinamiento de pantallas intermedias y popups**: revisar uno a uno los bottom sheets, diálogos de confirmación y estados de éxito — alturas máximas y scroll interno, teclado que tapa botones (`KeyboardAvoidingView`), cierre por gesto, consistencia visual y accesibilidad — para que tengan el mismo nivel de pulido que las pantallas principales.
2. **Estados de carga**: skeletons/shimmer en la primera carga de listas (el patrón ya existe en la versión Vue).
3. **Micro-interacciones pendientes**: pull-to-refresh en listas y haptics (`expo-haptics`) en confirmaciones; extender `ScalePressable`/`FadeUp` a los rincones de admin/portería que aún usan `Pressable` plano.

### Fase C — Análisis y rediseño de módulos clave
1. **Análisis del módulo de domicilios**: auditar el flujo completo residente↔portería antes de la siguiente iteración — ciclo de vida más rico (`esperado → llegó a portería → entregado / cancelado / expirado`), expiración automática de códigos, código QR además del numérico (`expo-camera`), evidencia de entrega con foto, e historial/métricas del turno para portería.
2. **Análisis del módulo de autorizaciones**: ahora que existen autorizaciones de persona y de vehículo temporal, revisar la experiencia del portero (búsqueda por placa además de apartamento, verificación rápida en garita), el manejo de vigencias (renovación, aviso de vencimiento) y el cruce con el registro de ingresos.

### Fase D — Contabilidad (ampliaciones)
1. Presupuesto anual vs. ejecutado y cobros extraordinarios (derramas).
2. Recordatorios automáticos de pago a unidades en mora (requiere push — Fase E).

### Fase E — Paridad y producción
1. **Paridad en Vue** de los módulos nuevos (roles propietario/habitante, multas, facturación).
2. Conectar Firebase real: desplegar `firestore.rules`, `VITE_DEMO_MODE=false` en Vue, adapter Firestore en `mobile/src/data/`; endurecer reglas por rol.
3. Push notifications (FCM / expo-notifications) para domicilios, visitas, correspondencia, reservas y facturación.
4. Publicación en tiendas con EAS Build. Los 5 botones del panel DEMO desaparecen en producción: cada usuario ve su aplicativo según su rol/tipo al iniciar sesión.

---

## 4. Pendientes conocidos / deuda técnica

- La semilla demo cambió a v3: en dispositivos donde ya corrió la app se reinician los datos de demostración.
- Las reglas de Firestore del proyecto `citofono-app` siguen siendo las antiguas (el deploy quedó bloqueado por el login interactivo del CLI).
- El wizard de crear edificio (`setup-building`) y los inputs de filtros/búsqueda no se migraron a react-hook-form (deliberado: el wizard multi-paso merece su propia migración).
- Warnings de `shadow*` deprecado en react-native-web (preexistentes, candidatos a Fase B).
- Pendiente de Fase A: auditoría de componentes 1:1 con `DESIGN_SYSTEM.md` y modo oscuro opcional (ya trivial de plantear sobre `tokens.json`).
- El backend Node/Express (push, validaciones) sigue fuera del repositorio; los videos de cámaras son streams públicos de demostración.
