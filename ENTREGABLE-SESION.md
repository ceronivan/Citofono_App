# PortalResidencial — Entregable de sesión

**Fecha:** 10 de junio de 2026
**Repositorio:** https://github.com/ceronivan/Citofono_App
**Ramas:** `main` (Vue 3) · `react-native` (Expo — iOS / Android / Web)

---

## 1. Resumen ejecutivo

En esta sesión se llevó la aplicación de un MVP de un solo edificio a una **plataforma multi-edificio completa con 3 roles** (residente, administrador, portería), en **dos implementaciones paralelas**: la versión web Vue 3 (rama `main`) y un port completo a React Native con Expo (rama `react-native`) que corre con un solo código en iOS, Android y navegador.

Ambas versiones funcionan en **modo demo** (datos dummy persistentes, sin depender de Firebase) con una arquitectura intercambiable lista para conectar Firebase real sin tocar pantallas.

**Cuentas demo** (cualquier contraseña): `residente@demo.com` · `admin@demo.com` · `portero@demo.com`
**Códigos de domicilio activos:** `4821` (Pizza) · `7350` (Mercado) · **Código de invitación:** `PRADO-DEMO`

---

## 2. Trabajo realizado — rama `main` (Vue 3 + Vuetify)

### 2.1 Arquitectura multi-edificio (v2)
- **Memberships por usuario**: una persona puede pertenecer a N edificios con un rol distinto en cada uno (ej. admin de 2 edificios y residente en otro). Compatible con los usuarios v1.
- **Switcher de edificios** estilo Slack (bottom sheet animado) en los headers de los 3 roles.
- **Wizard de creación de edificio** (4 pasos): datos básicos → torres (genera apartamentos automáticamente: piso 5 apto 2 = "502") → amenidades con reglas → resumen → pantalla de éxito con código de invitación.
- **Invitaciones con código** (`invites/{código}`): el admin crea códigos por rol (residente / portería / co-admin) con límite de usos; el propietario se registra solo, elige torre/apto y reclama su unidad.

### 2.2 Módulos nuevos
| Módulo | Descripción |
|--------|-------------|
| **Domicilios con código** | El residente registra el pedido (negocio + código de 4-6 dígitos); el portero lo verifica con un teclado numérico con validación en vivo, vibración y animación de éxito; el residente recibe notificación. |
| **Cartera / morosos** | Grilla de unidades por torre; el admin marca "al día / en mora" por periodo. Las reservas de amenidades configuradas con bloqueo se deshabilitan automáticamente para aptos en mora (con candados visibles y aviso explicativo). |
| **Amenidades configurables** | Por edificio: nombre, ícono, "requiere aprobación", "bloquear en mora", activa/inactiva. El formulario de reservas las consume dinámicamente. |
| **Cámaras (mock)** | Grid estilo CCTV con overlay REC + reloj en vivo; admin las administra, portero solo las ve. Streams de demostración hasta conectar el hardware real. |
| **Mantenimientos** | El admin programa (ascensor, piscina, zonas; proveedor y recurrencia); residentes y portería ven el calendario. |
| **Registro de ingresos** | Vista admin agrupada por apartamento con contadores, barras comparativas y filtros (hoy / 7 / 30 días). |

### 2.3 Capa de datos demo (modo sin Firebase)
- Alias de Vite activado por `VITE_DEMO_MODE=true`: sustituye `firebase/{app,auth,firestore,storage}` por mocks en `src/demo/` (mini-Firestore en memoria con persistencia en `localStorage`, queries, transacciones y batches).
- Panel **DEMO** en el login con acceso de un toque a los 3 roles.
- Para conectar Firebase real: `VITE_DEMO_MODE=false` + desplegar `firestore.rules` (`firebase login` + `firebase deploy --only firestore:rules` — config lista en `firebase.json` / `.firebaserc`).

### 2.4 UX, heurísticas de Nielsen y accesibilidad
- **Logout funcional** en los 3 roles (antes limpiaba sesión sin navegar) + ícono de salir en el dashboard del residente, con confirmación.
- **Botón de regresar** en todas las pantallas (la prop booleana ausente se casteaba a `false` — nunca se renderizaba) + fallback al dashboard sin historial.
- **Confirmación de acciones destructivas** (Nielsen #5): diálogo global para eliminar vehículos, autorizaciones, códigos, cámaras, mantenimientos y cancelar domicilios.
- **Botones de formularios** corregidos (se desbordaban: dos botones block en una fila + clases `gap-*` inexistentes en Vuetify).
- **Marco de teléfono en escritorio** (390 px con notch) emulando `env(safe-area-inset-top)`; en móvil real el safe area es nativo.
- PWA instalable (manifest + íconos), lista para empaquetar con Capacitor.

---

## 3. Trabajo realizado — rama `react-native` (Expo)

### 3.1 Port completo
- **Stack:** Expo SDK 56 + expo-router (file-based routing) + zustand + TypeScript + AsyncStorage + expo-video. Un solo código → iOS, Android y web.
- **Las ~35 pantallas de los 3 roles**: dashboards, domicilios + verificación con teclado, reservas con bloqueo por mora, cartera, switcher multi-edificio, wizard de edificio, invitaciones, cámaras, mantenimientos, registro de ingresos, visitas, vehículos, autorizaciones, correo, noticias/circulares con detalle, avisos, PQRs, daños, perfil, login/registro.
- **Capa de datos demo** equivalente a la de Vue: repositorio genérico (`list/find/add/update/remove`) sobre AsyncStorage con la misma semilla. Para Firebase real solo se implementa ese API sobre Firestore (documentado en `mobile/README.md`).

### 3.2 Paridad visual y accesibilidad
- Design tokens portados 1:1 (`mobile/src/theme.ts`) — mismos colores, radios y sombras que la versión Vue; mismos íconos MDI.
- **Escala tipográfica accesible**: piso de 12 px en toda la app; `textSecondary`/`textTertiary` oscurecidos para cumplir **contraste WCAG AA** en texto pequeño.
- En web la app vive centrada a ancho de teléfono (460 px) sobre fondo oscuro, como la versión Vue.

### 3.3 UX de la última iteración
- **Menú inferior persistente**: las pantallas compartidas se movieron dentro del grupo de tabs como pantallas ocultas — el menú ya no desaparece en ninguna pantalla del residente, y cada una conserva su botón de regresar.
- **Grillas uniformes**: celdas de ancho fijo (33.33%) en zonas comunes de Nueva Reserva, módulos del dashboard y unidades del admin — todas las tarjetas idénticas.
- **Date pickers correctos**: componente `DateField` multiplataforma — picker nativo del sistema en iOS/Android (`@react-native-community/datetimepicker`) y `<input type="date">` en web.
- **Micro-interacciones y transiciones**: `ScalePressable` (rebote spring al presionar), `FadeUp` con stagger en listas, `PopIn` en confirmaciones de éxito, transición `shift` entre tabs y `slide/fade` en el stack de autenticación.

### 3.4 Cómo correr cada versión
```bash
# Vue (rama main)
cd frontend && npm install && npm run dev        # http://localhost:5173

# React Native (rama react-native)
cd mobile && npm install
npm run web      # navegador
npm start        # QR para Expo Go en el teléfono (sin Android Studio/Xcode)
```

---

## 4. Pasos a seguir (roadmap propuesto)

### Fase A — Estandarizar look & feel en toda la aplicación
1. **Fuente de verdad única de design tokens**: hoy `frontend/src/assets/styles/variables.css` y `mobile/src/theme.ts` están duplicados a mano. Extraer un `tokens.json` compartido en la raíz y generar ambos archivos (script de build), para que un cambio de color/espaciado se propague a las dos apps.
2. **Tipografía Inter en React Native**: la versión Vue usa Inter; el port usa la fuente del sistema. Cargar Inter con `expo-font` (`@expo-google-fonts/inter`) y aplicarla en el kit UI.
3. **Auditoría de componentes 1:1**: recorrer pantalla por pantalla comparando Vue ↔ RN (headers, chips de estado, espaciados de tarjetas, empty states) y documentar el componente canónico de cada patrón en un `DESIGN_SYSTEM.md` actualizado.
4. **Modo oscuro** (opcional): los tokens ya lo permiten; definir paleta dark una sola vez en el `tokens.json`.

### Fase B — Corrección de errores de UI
1. **Paddings y safe areas de los menús**: revisar el tab bar en dispositivos con home indicator (iPhone X+) — usar `useSafeAreaInsets` en el `tabBarStyle` en vez de altura fija (64 px); verificar el recorte de labels en Android con fuentes grandes del sistema.
2. **Micro-interacciones pendientes**: extender `ScalePressable`/`FadeUp` a las pantallas de admin y portería que aún usan `Pressable` plano (filtros de cartera, rangos del registro de ingresos, chips de amenidades del wizard); agregar *pull-to-refresh* en listas y *haptics* (`expo-haptics`) en confirmaciones.
3. **Teclado**: envolver formularios largos en `KeyboardAvoidingView` para que el teclado no tape los botones de guardar (registro, wizard, PQRs).
4. **Estados de carga**: skeletons en lugar de listas vacías durante la primera carga (el patrón shimmer ya existe en la versión Vue).

### Fase C — Actualizar módulo de domicilios
1. **Ciclo de vida más rico**: estados `esperado → llegó a portería → entregado / cancelado / expirado`; expiración automática de códigos (ej. 12 h) para que la lista del portero no acumule pedidos viejos.
2. **Evidencia de entrega**: foto opcional del repartidor/paquete al autorizar (cámara del dispositivo con `expo-image-picker`).
3. **Código QR** además del numérico: el residente muestra/comparte un QR que el portero escanea (`expo-camera`), más rápido que teclear.
4. **Historial y métricas para portería**: entregas del turno, búsqueda por apartamento, contador de pendientes en el tab.
5. **Notificación push real** al residente cuando el domicilio se autoriza (requiere Fase E).

### Fase D — Roles de residente: propietario vs. residente
**Problema:** hoy "residente" asume que quien vive en el apartamento es el dueño. Si el apto está arrendado, el arrendatario necesita la app para el día a día, pero hay decisiones que solo competen al propietario (la mora, por ejemplo, es deuda del dueño aunque el que vive sea otro).

**Propuesta — dos sub-roles dentro de la unidad:**

| Capacidad | `owner` (propietario) | `tenant` (residente/arrendatario) |
|-----------|:---:|:---:|
| Ver estado de cartera de su unidad y recibir avisos de mora | ✅ | ❌ (la mora es del dueño) |
| Invitar/revocar arrendatarios de su unidad | ✅ | ❌ |
| Reservar amenidades, domicilios, visitas, correo, PQRs, vehículos, autorizaciones | ✅ (si reside) | ✅ |
| ¿Bloqueo de reservas si la unidad está en mora? | ✅ | ✅ (la unidad queda bloqueada, sin importar quién reserve) |
| Editar datos de la unidad (parqueadero, mascotas) | ✅ | ❌ |

**Cambios técnicos:**
1. `Membership` gana `residentType: 'owner' | 'tenant'` (default `owner` para datos existentes — sin migración disruptiva).
2. `Unit` separa `ownerIds` (responsables de cartera, pueden no vivir ahí) de `tenantIds` (quienes habitan).
3. **Invitaciones en dos niveles**: el admin invita propietarios (como hoy); el propietario genera códigos de arrendatario **ligados a su unidad** desde su perfil (con vigencia, ej. duración del contrato).
4. El admin ve en la grilla de unidades quién es dueño y quién habita; portería ve a ambos como residentes válidos del apto.
5. Caso borde a decidir con negocio: propietario que no reside (no debería reservar amenidades "personales" — configurable por edificio).

### Fase E — Producción
1. **Conectar Firebase real**: desplegar `firestore.rules` (pendiente: requiere `firebase login` interactivo), poner `VITE_DEMO_MODE=false` en Vue e implementar el adapter Firestore en `mobile/src/data/`.
2. **Endurecer reglas de Firestore por rol** (hoy son permisivas para desarrollo: cualquier autenticado lee/escribe dentro del conjunto).
3. **Push notifications** (FCM / expo-notifications) para domicilios, visitas, correspondencia y reservas.
4. **Publicación en tiendas** con EAS Build (no requiere Android Studio/Xcode locales) y decidir cuál versión es la principal (recomendación: RN para móvil + Vue para el panel admin de escritorio, compartiendo Firebase).

---

## 5. Pendientes conocidos / deuda técnica

- Las reglas de Firestore del proyecto `citofono-app` siguen siendo las antiguas (el deploy quedó bloqueado por el login interactivo del CLI). Existe una cuenta real `admin.demo@portalresidencial.app` / `Demo123456` creada en Firebase Auth, sin edificio.
- En la versión RN, los formularios usan campos simplificados en algunos puntos (sin subida de fotos todavía); la funcionalidad está completa.
- El backend Node/Express (push, validaciones) existe en el workspace local de la versión Vue pero no está en el repositorio ni desplegado.
- Los videos de cámaras son streams públicos de demostración.
