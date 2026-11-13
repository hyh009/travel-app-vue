<script setup lang="ts">
import { watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { ROUTE_NAME } from '@/router/utils'
import { useToast } from '@/composables/useToast'
import { useRoute, useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'

const { state: toast } = useToast()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

watch(
  () => auth.isLoggedIn,
  (loggedIn) => {
    if (loggedIn || !route.meta.requiresAuth) return
    router.replace({ name: ROUTE_NAME.LOGIN, query: { redirect: route.fullPath } })
  },
)
</script>

<template>
  <v-app>
    <AppHeader />
    <v-main>
      <RouterView />
    </v-main>
    <v-snackbar
      v-model="toast.show"
      :color="toast.type"
      timeout="3000"
    >
      {{ toast.message }}
    </v-snackbar>
  </v-app>
</template>

<style>
/* 地圖 App 不需要網頁本身的雙指縮放(地圖的縮放由 Leaflet 處理):
   一根手指在面板、另一根在 header 時,瀏覽器會把它當成縮放整個網頁,放大後重新整理也不會復原。
   只在觸控裝置套用。地圖容器自己是 touch-action: none,和這個取交集後不變 */
@media (pointer: coarse) {
  html {
    touch-action: pan-x pan-y;
  }
}
</style>
