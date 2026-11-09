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
