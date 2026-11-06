import { useAuthStore } from '@/stores/auth'
import { createRouter, createWebHistory } from 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    guestOnly?: boolean
  }
}

export const ROUTE_NAME = {
  HOME: 'home',
  LOGIN: 'login',
} as const

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
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.guestOnly && auth.isLoggedIn) {
    return { name: ROUTE_NAME.HOME }
  }
})

export default router
