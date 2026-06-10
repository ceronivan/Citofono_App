import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const DASHBOARD: Record<string, string> = {
  resident: '/',
  admin: '/admin',
  guard: '/guard',
}

export const authGuard = async (
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext,
) => {
  const authStore = useAuthStore()

  // Wait for Firebase auth state if not resolved yet
  if (authStore.loading) {
    await authStore.init()
  }

  const isAuth = authStore.isAuthenticated
  const role = authStore.role

  // Usuario autenticado sin membership (admin nuevo) → wizard de creación
  if (isAuth && !role && to.path !== '/setup/building') {
    return next('/setup/building')
  }

  // Authenticated user tries to access auth pages → redirect to their dashboard
  if (!to.meta.requiresAuth && isAuth && role) {
    return next(DASHBOARD[role])
  }

  // Unauthenticated user tries to access protected route
  if (to.meta.requiresAuth && !isAuth) {
    return next('/login')
  }

  // User with wrong role tries to access a protected route
  if (to.meta.roles && role && !(to.meta.roles as string[]).includes(role)) {
    return next(DASHBOARD[role] ?? '/login')
  }

  next()
}
