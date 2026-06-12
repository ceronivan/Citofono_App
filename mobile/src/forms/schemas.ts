/**
 * Esquemas de validación (yup) de todos los formularios de la app.
 * La lógica de UI vive en cada pantalla con react-hook-form; aquí solo
 * se declaran las reglas y mensajes. Los campos numéricos se validan
 * como string con regex y se convierten en el submit de cada pantalla.
 */
import * as yup from 'yup'

const req = (msg: string) => yup.string().trim().required(msg)

// ─── Autenticación ───────────────────────────────────────────────────────────
export const loginSchema = yup.object({
  email: req('Ingresa tu correo').email('Correo inválido'),
  password: yup.string().required('Ingresa tu contraseña'),
})
export type LoginForm = yup.InferType<typeof loginSchema>

export const inviteCodeSchema = yup.object({
  code: req('Ingresa el código de invitación'),
})
export type InviteCodeForm = yup.InferType<typeof inviteCodeSchema>

/** Registro de cuenta. `isResident`/`multiTower` activan torre y apartamento. */
export const registerSchema = (isResident: boolean, multiTower: boolean) =>
  yup.object({
    firstName: req('Ingresa tu nombre'),
    lastName: req('Ingresa tu apellido'),
    idNumber: req('Ingresa tu cédula').matches(/^\d{5,15}$/, 'Cédula inválida (solo números)'),
    phone: req('Ingresa tu celular').matches(/^\d{7,15}$/, 'Celular inválido (solo números)'),
    email: req('Ingresa tu correo').email('Correo inválido'),
    password: yup.string().required('Crea una contraseña').min(6, 'Mínimo 6 caracteres'),
    tower: multiTower ? req('Selecciona la torre') : yup.string().default(''),
    apartmentNumber: isResident ? req('Ingresa tu apartamento') : yup.string().default(''),
  })
export type RegisterForm = yup.InferType<ReturnType<typeof registerSchema>>

// ─── Residente ───────────────────────────────────────────────────────────────
export const deliverySchema = yup.object({
  vendor: req('Indica el negocio o app'),
  description: yup.string().trim().default(''),
  code: req('Ingresa el código').matches(/^\d{4,6}$/, 'El código debe tener de 4 a 6 dígitos'),
})
export type DeliveryForm = yup.InferType<typeof deliverySchema>

export const vehicleSchema = yup.object({
  type: req('Selecciona el tipo'),
  brand: req('Ingresa la marca'),
  color: yup.string().trim().default(''),
  plate: req('Ingresa la placa').matches(/^[A-Za-z0-9-]{5,7}$/, 'Placa inválida'),
})
export type VehicleForm = yup.InferType<typeof vehicleSchema>

/** Autorización de ingreso: persona recurrente o vehículo temporal (visitas). */
export const authorizationSchema = yup.object({
  type: yup.string().oneOf(['person', 'vehicle']).required(),
  firstName: yup.string().trim().default('').when('type', {
    is: 'person',
    then: (s) => s.required('Ingresa el nombre'),
  }),
  lastName: yup.string().trim().default('').when('type', {
    is: 'person',
    then: (s) => s.required('Ingresa el apellido'),
  }),
  idNumber: yup.string().trim().default('').when('type', {
    is: 'person',
    then: (s) => s.required('Ingresa la cédula').matches(/^\d{5,15}$/, 'Cédula inválida (solo números)'),
  }),
  plate: yup.string().trim().default('').when('type', {
    is: 'vehicle',
    then: (s) => s.required('Ingresa la placa').matches(/^[A-Za-z0-9-]{5,7}$/, 'Placa inválida'),
  }),
  vehicleDescription: yup.string().trim().default(''),
  days: req('Indica los días').matches(/^\d{1,3}$/, 'Entre 1 y 365 días')
    .test('range', 'Entre 1 y 365 días', (v) => Number(v) >= 1 && Number(v) <= 365),
})
export type AuthorizationForm = yup.InferType<typeof authorizationSchema>

export const reservationSchema = yup.object({
  amenityId: req('Selecciona la zona común'),
  title: req('Dale un título a tu reserva'),
  responsible: req('Indica el responsable'),
  date: req('Selecciona la fecha').matches(/^\d{4}-\d{2}-\d{2}$/, 'Selecciona la fecha'),
  hours: req('Indica las horas').matches(/^\d{1,2}$/, 'Entre 1 y 24 horas')
    .test('range', 'Entre 1 y 24 horas', (v) => Number(v) >= 1 && Number(v) <= 24),
})
export type ReservationForm = yup.InferType<typeof reservationSchema>

/** PQRs y reportes de daño (TicketModule). `withCategory` exige categoría. */
export const ticketSchema = (withCategory: boolean) =>
  yup.object({
    category: withCategory ? req('Selecciona la categoría') : yup.string().default(''),
    title: req('Ingresa el título'),
    description: req('Describe tu solicitud'),
  })
export type TicketForm = yup.InferType<ReturnType<typeof ticketSchema>>

// ─── Portería ────────────────────────────────────────────────────────────────
export const visitSchema = yup.object({
  type: yup.string().oneOf(['pedestrian', 'vehicle']).required(),
  apt: req('Indica el apartamento').matches(/^\d{1,5}$/, 'Apartamento inválido'),
  name: req('Ingresa el nombre'),
  idNumber: yup.string().trim().default('').matches(/^\d*$/, 'Cédula inválida (solo números)'),
  plate: yup.string().trim().default('').when('type', {
    is: 'vehicle',
    then: (s) => s.required('Ingresa la placa').matches(/^[A-Za-z0-9-]{5,7}$/, 'Placa inválida'),
  }),
})
export type VisitForm = yup.InferType<typeof visitSchema>

export const mailSchema = yup.object({
  apt: req('Indica el apartamento').matches(/^\d{1,5}$/, 'Apartamento inválido'),
  type: req('Selecciona el tipo'),
  description: req('Describe la correspondencia'),
  sender: yup.string().trim().default(''),
})
export type MailForm = yup.InferType<typeof mailSchema>

// ─── Administración ──────────────────────────────────────────────────────────
export const postSchema = yup.object({
  title: req('Ingresa el título'),
  body: req('Escribe el contenido'),
})
export type PostForm = yup.InferType<typeof postSchema>

export const maintenanceSchema = yup.object({
  asset: req('Selecciona el equipo o zona'),
  title: req('Ingresa el título'),
  provider: yup.string().trim().default(''),
  date: req('Selecciona la fecha').matches(/^\d{4}-\d{2}-\d{2}$/, 'Selecciona la fecha'),
  recurrence: req('Selecciona la recurrencia'),
})
export type MaintenanceForm = yup.InferType<typeof maintenanceSchema>

/** Multa o llamado de atención del admin a una unidad. */
export const sanctionSchema = yup.object({
  type: yup.string().oneOf(['fine', 'warning']).required(),
  tower: yup.string().trim().default(''),
  apartmentNumber: req('Indica el apartamento').matches(/^\d{1,5}$/, 'Apartamento inválido'),
  title: req('Ingresa el título'),
  description: yup.string().trim().default(''),
  amount: yup.string().trim().default('').when('type', {
    is: 'fine',
    then: (s) =>
      s.required('Indica el valor de la multa').matches(/^\d{3,12}$/, 'Valor inválido (solo números)'),
  }),
})
export type SanctionForm = yup.InferType<typeof sanctionSchema>

/** Pago a proveedor / servicio contratado (gasto de la administración). */
export const expenseSchema = yup.object({
  category: req('Selecciona la categoría'),
  provider: req('Indica el proveedor'),
  description: yup.string().trim().default(''),
  amount: req('Indica el valor').matches(/^\d{3,12}$/, 'Valor inválido (solo números)'),
  date: req('Selecciona la fecha').matches(/^\d{4}-\d{2}-\d{2}$/, 'Selecciona la fecha'),
})
export type ExpenseForm = yup.InferType<typeof expenseSchema>

/** Configuración de la cuota de administración del edificio. */
export const feeConfigSchema = yup.object({
  feeBase: req('Indica la cuota base').matches(/^\d{3,12}$/, 'Valor inválido (solo números)'),
  feeDueDay: req('Indica el día de vencimiento').matches(/^\d{1,2}$/, 'Entre 1 y 28')
    .test('range', 'Entre 1 y 28', (v) => Number(v) >= 1 && Number(v) <= 28),
})
export type FeeConfigForm = yup.InferType<typeof feeConfigSchema>

/** Edición del propio perfil. */
export const profileSchema = yup.object({
  firstName: req('Ingresa tu nombre'),
  lastName: req('Ingresa tu apellido'),
  phone: req('Ingresa tu celular').matches(/^\d{7,15}$/, 'Celular inválido (solo números)'),
})
export type ProfileForm = yup.InferType<typeof profileSchema>

export const cameraSchema = yup.object({
  name: req('Ingresa el nombre'),
  location: yup.string().trim().default(''),
  streamUrl: req('Ingresa la URL del stream')
    .matches(/^(https?|rtsp):\/\/\S+$/i, 'URL inválida (http, https o rtsp)'),
})
export type CameraForm = yup.InferType<typeof cameraSchema>
