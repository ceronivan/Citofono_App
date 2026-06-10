import type { RouteRecordRaw } from 'vue-router'
import AdminLayout from '@/layouts/AdminLayout.vue'

export const adminRoutes: RouteRecordRaw[] = [
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAuth: true, roles: ['admin'] },
    children: [
      { path: '', name: 'admin-dashboard', component: () => import('@/views/admin/DashboardView.vue') },
      { path: 'news', name: 'admin-news', component: () => import('@/views/admin/NewsManageView.vue') },
      { path: 'circulars', name: 'admin-circulars', component: () => import('@/views/admin/CircularsManageView.vue') },
      { path: 'reservations', name: 'admin-reservations', component: () => import('@/views/admin/ReservationsManageView.vue') },
      { path: 'pqrs', name: 'admin-pqrs', component: () => import('@/views/admin/PQRsManageView.vue') },
      { path: 'damage-reports', name: 'admin-damage-reports', component: () => import('@/views/admin/DamageReportsManageView.vue') },
      { path: 'building', name: 'admin-building', component: () => import('@/views/admin/BuildingManageView.vue') },
      { path: 'building/units', name: 'admin-units', component: () => import('@/views/admin/UnitsManageView.vue') },
      { path: 'building/amenities', name: 'admin-amenities', component: () => import('@/views/admin/AmenitiesManageView.vue') },
      { path: 'building/invites', name: 'admin-invites', component: () => import('@/views/admin/InvitesManageView.vue') },
      { path: 'cameras', name: 'admin-cameras', component: () => import('@/views/admin/CamerasManageView.vue') },
      { path: 'maintenance', name: 'admin-maintenance', component: () => import('@/views/admin/MaintenanceManageView.vue') },
      { path: 'entry-log', name: 'admin-entry-log', component: () => import('@/views/admin/EntryLogView.vue') },
    ],
  },
]
