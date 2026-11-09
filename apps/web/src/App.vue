<script setup lang="ts">
import { watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { ROUTE_NAME } from '@/router/utils'
import { useToast } from '@/composables/useToast'
import { useRoute, useRouter } from 'vue-router'

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
    <v-app-bar title="台灣景點">
      <template v-if="auth.user">
        <v-btn :to="{ name: ROUTE_NAME.FAVORITES }">收藏</v-btn>
        <span class="mx-2 d-none d-sm-inline">{{ auth.user.name ?? auth.user.email }}</span>
        <v-btn @click="auth.logout()">登出</v-btn>
      </template>
      <template v-else>
        <v-btn :to="{ name: ROUTE_NAME.LOGIN }">登入</v-btn>
        <v-btn :to="{ name: ROUTE_NAME.REGISTER }">註冊</v-btn>
      </template>
    </v-app-bar>
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
