import { createRouter, createWebHistory } from 'vue-router'
import { residentRoutes } from './routes/resident.routes'
import { adminRoutes } from './routes/admin.routes'
import { guardRoutes } from './routes/guard.routes'
import { authGuard } from './guards'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: () => import('@/views/auth/ForgotPasswordView.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/auth/RegisterView.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/setup/building',
      name: 'building-setup',
      component: () => import('@/views/setup/BuildingSetupView.vue'),
      meta: { requiresAuth: true },
    },
    ...residentRoutes,
    ...adminRoutes,
    ...guardRoutes,
    // Development only — seed page
    ...(import.meta.env.DEV ? [{
      path: '/dev/seed',
      name: 'dev-seed',
      component: () => import('@/views/dev/SeedView.vue'),
      meta: { requiresAuth: true },
    }] : []),
    { path: '/:pathMatch(.*)*', redirect: '/login' },
  ],
})

router.beforeEach(authGuard)

export default router
