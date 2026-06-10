import type { RouteRecordRaw } from 'vue-router'
import GuardLayout from '@/layouts/GuardLayout.vue'

export const guardRoutes: RouteRecordRaw[] = [
  {
    path: '/guard',
    component: GuardLayout,
    meta: { requiresAuth: true, roles: ['guard'] },
    children: [
      { path: '', name: 'guard-dashboard', component: () => import('@/views/guard/DashboardView.vue') },
      { path: 'visits/new', name: 'guard-visit-new', component: () => import('@/views/guard/RegisterVisitView.vue') },
      { path: 'mail/new', name: 'guard-mail-new', component: () => import('@/views/guard/RegisterMailView.vue') },
      { path: 'authorizations', name: 'guard-authorizations', component: () => import('@/views/guard/CheckAuthorizationsView.vue') },
      { path: 'deliveries', name: 'guard-deliveries', component: () => import('@/views/guard/VerifyDeliveryView.vue') },
      { path: 'cameras', name: 'guard-cameras', component: () => import('@/views/guard/CamerasView.vue') },
    ],
  },
]
