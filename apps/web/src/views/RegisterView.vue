<script setup lang="ts">
import { reactive, ref } from 'vue'
import { registerSchema } from '@travel/shared'
import { ApiError } from '@/api/error'
import { useAuthStore } from '@/stores/auth'
import { errorMessage } from '@/utils/errorMessages'
import { mdiAccountOutline, mdiEmailOutline, mdiEye, mdiEyeOff, mdiLockOutline } from '@mdi/js'
import { useRouter, useRoute } from 'vue-router'
import { ROUTE_NAME, safeRedirect } from '@/router/utils'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const form = reactive({ name: '', email: '', password: '' })
const errors = ref<Partial<Record<'name' | 'email' | 'password' | 'form', string>>>({})
const submitting = ref(false)
const showPassword = ref(false)

async function submit() {
  errors.value = {}

  // 名稱是選填:空字串視為沒填
  const result = registerSchema.safeParse({ ...form, name: form.name || undefined })
  if (!result.success) {
    const failed = new Set(result.error.issues.map((issue) => issue.path[0]))
    errors.value = {
      name: failed.has('name') ? '名稱最多 50 個字' : undefined,
      email: failed.has('email') ? 'Email 格式不正確' : undefined,
      password: failed.has('password') ? '密碼需要 8 到 72 個字元' : undefined,
    }
    return
  }

  submitting.value = true
  try {
    await auth.register(result.data)
    await router.push(safeRedirect(route.query.redirect))
  } catch (err) {
    if (err instanceof ApiError && err.code === 'EMAIL_TAKEN') {
      errors.value = { email: errorMessage(err) }
    } else {
      errors.value = { form: errorMessage(err) }
      if (!(err instanceof ApiError)) console.error(err)
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <v-container class="d-flex align-center h-100">
    <v-card
      class="mx-auto pa-6"
      width="100%"
      max-width="420"
      elevation="4"
      rounded="lg"
    >
      <div class="text-center mb-6">
        <div class="text-h5 font-weight-bold">建立帳號</div>
        <div class="text-body-2 text-medium-emphasis mt-1">註冊後就能收藏喜歡的景點</div>
      </div>

      <v-form @submit.prevent="submit">
        <v-text-field
          v-model="form.name"
          label="名稱(選填)"
          variant="outlined"
          autocomplete="nickname"
          :prepend-inner-icon="mdiAccountOutline"
          :error-messages="errors.name"
        />
        <v-text-field
          v-model="form.email"
          label="Email"
          type="email"
          variant="outlined"
          autocomplete="email"
          :prepend-inner-icon="mdiEmailOutline"
          :error-messages="errors.email"
        />
        <v-text-field
          v-model="form.password"
          label="密碼"
          variant="outlined"
          autocomplete="new-password"
          :type="showPassword ? 'text' : 'password'"
          :prepend-inner-icon="mdiLockOutline"
          :append-inner-icon="showPassword ? mdiEyeOff : mdiEye"
          :error-messages="errors.password"
          @click:append-inner="showPassword = !showPassword"
        />
        <div
          v-if="errors.form"
          class="text-error text-body-2 mb-2"
        >
          {{ errors.form }}
        </div>
        <v-btn
          type="submit"
          color="primary"
          size="large"
          block
          class="mt-2"
          :loading="submitting"
        >
          註冊
        </v-btn>
      </v-form>

      <div class="text-center mt-4 text-body-2">
        已經有帳號?
        <router-link :to="{ name: ROUTE_NAME.LOGIN, query: route.query }">登入</router-link>
      </div>
    </v-card>
  </v-container>
</template>
