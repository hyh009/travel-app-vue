<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { ROUTE_NAME } from '@/router/utils'
import { useToast } from '@/composables/useToast'
const { state: toast } = useToast()

const auth = useAuthStore()
</script>

<template>
  <v-app>
    <v-app-bar title="台灣景點">
      <template v-if="auth.user">
        <v-btn :to="{ name: ROUTE_NAME.FAVORITES }">收藏</v-btn>
        <span class="mx-2">{{ auth.user.name ?? auth.user.email }}</span>
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
