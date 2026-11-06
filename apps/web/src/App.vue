<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { ROUTE_NAME } from '@/router'

const auth = useAuthStore()
</script>

<template>
  <v-app>
    <v-app-bar title="台灣景點">
      <template v-if="auth.user">
        <span class="mr-2">{{ auth.user.name ?? auth.user.email }}</span>
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
  </v-app>
</template>
