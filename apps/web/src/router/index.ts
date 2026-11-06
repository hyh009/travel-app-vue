import { useAuthStore } from '@/stores/auth'
import { createRouter, createWebHistory } from 'vue-router'
import { ROUTE_NAME } from './utils'

declare module 'vue-router' {
  interface RouteMeta {
    guestOnly?: boolean
    requiresAuth?: boolean
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: ROUTE_NAME.HOME, component: () => import('@/views/HomeView.vue') },
    {
      path: '/login',
      name: ROUTE_NAME.LOGIN,
      component: () => import('@/views/LoginView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/register',
      name: ROUTE_NAME.REGISTER,
      component: () => import('@/views/RegisterView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/favorites',
      name: ROUTE_NAME.FAVORITES,
      component: () => import('@/views/FavoritesView.vue'),
      meta: { requiresAuth: true },
    },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.guestOnly && auth.isLoggedIn) {
    return { name: ROUTE_NAME.HOME }
  }
  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return { name: ROUTE_NAME.LOGIN, query: { redirect: to.fullPath } }
  }
})

export default router
