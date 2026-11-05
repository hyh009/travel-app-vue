import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { LoginInput, PublicUser, RegisterInput } from '@travel/shared'
import { setSessionExpiredHandler } from '@/api/client'
import * as authService from '@/services/auth.service'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<PublicUser | null>(null)
  const isLoggedIn = computed(() => user.value !== null)

  setSessionExpiredHandler(() => {
    user.value = null
  })

  async function restore() {
    try {
      user.value = (await authService.fetchMe()).user
    } catch {
      user.value = null
    }
  }

  async function login(input: LoginInput) {
    user.value = (await authService.login(input)).user
  }

  async function register(input: RegisterInput) {
    user.value = (await authService.register(input)).user
  }

  async function logout() {
    try {
      await authService.logout()
    } finally {
      user.value = null
    }
  }

  return { user, isLoggedIn, restore, login, register, logout }
})
