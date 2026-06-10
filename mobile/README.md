# PortalResidencial — App React Native (Expo)

Port completo de la aplicación a **React Native con Expo**: un solo código corre en
**iOS, Android y web** (react-native-web).

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Expo SDK 56 + expo-router (file-based routing) |
| Lenguaje | TypeScript |
| Estado | zustand |
| Datos (demo) | AsyncStorage (`src/data/db.ts` + `src/data/seed.ts`) |
| Video (cámaras) | expo-video |
| Íconos | MaterialCommunityIcons (mismos nombres MDI que la versión Vue) |

## Correr la app

```bash
cd mobile
npm install

npm run web       # versión web en el navegador
npm start         # escanea el QR con la app Expo Go (Android/iOS)
```

No necesitas Android Studio ni Xcode para desarrollar. Para publicar en las
tiendas más adelante: [EAS Build](https://docs.expo.dev/build/introduction/).

## Cuentas demo (cualquier contraseña)

| Cuenta | Rol |
|--------|-----|
| `residente@demo.com` | Residente — Torre A · 101 de "Conjunto El Prado" |
| `admin@demo.com` | Admin de 2 edificios (El Prado + Mirador) — prueba el switcher |
| `portero@demo.com` | Portería — verifica domicilios con los códigos `4821` y `7350` |

También puedes registrarte con el código de invitación `PRADO-DEMO`, o crear tu
propio edificio con "Soy administrador".

## Arquitectura de datos (lista para Firebase)

Las pantallas **no hablan con la base directamente**: usan los stores
(`src/stores/`) y el hook `useCollection` (`src/hooks/useCollection.ts`), que a
su vez consumen el API genérico de `src/data/db.ts`:

```
list(col) · find(col, id) · add(col, doc) · update(col, id, patch) · remove(col, id)
```

Para conectar Firebase real solo hay que implementar ese mismo API sobre
Firestore (con los mismos paths: `users`, `invites`, `complexes`,
`{complexId}/units`, `{complexId}/deliveries`, …) sin tocar pantallas ni stores.
Los timestamps son milisegundos epoch (`number`) — conviértelos con
`Timestamp.fromMillis()` / `toMillis()` en esa capa.

## Estructura

```
src/
├── app/                  # Rutas (expo-router)
│   ├── login / register / setup-building
│   ├── resident/         # Tabs: inicio, noticias, avisos, reservas, perfil
│   ├── admin/            # Tabs + unidades/cartera, amenidades, invitaciones,
│   │                     #   cámaras, mantenimientos, registro de ingresos
│   ├── guard/            # Tabs: visitas, domicilios (teclado), correo, cámaras
│   └── deliveries, vehicles, visits, mail, pqrs…  # Pantallas compartidas
├── components/           # Kit UI (Screen, Btn, Input, BottomSheet, CameraGrid…)
├── data/                 # Capa demo: db + seed + versión reactiva
├── stores/               # zustand: auth (memberships multi-edificio), confirm
├── hooks/                # useCollection (lectura reactiva de colecciones)
├── theme.ts              # Design tokens (mismos de la versión Vue)
└── types.ts              # Modelos de datos
```
