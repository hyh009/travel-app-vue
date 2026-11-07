<script setup lang="ts">
import { reactive, ref } from 'vue'
import { loginSchema } from '@travel/shared'
import { ApiError } from '@/api/error'
import { useAuthStore } from '@/stores/auth'
import { errorMessage } from '@/utils/errorMessages'
import { mdiEmailOutline, mdiEye, mdiEyeOff, mdiLockOutline } from '@mdi/js'
import { useRouter, useRoute } from 'vue-router'
import { ROUTE_NAME, safeRedirect } from '@/router/utils'
import AppTextField from '@/components/AppTextField.vue'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const form = reactive({ email: '', password: '' })
const fieldErrors = ref<Partial<Record<'email' | 'password', string>>>({})
// 帳號或密碼錯:兩個欄位都標紅,訊息只顯示一次
const credentialsError = ref<string | null>(null)
// 斷線、伺服器錯誤:不屬於任何欄位,顯示在按鈕上方
const formError = ref<string | null>(null)
const submitting = ref(false)
const showPassword = ref(false)

async function submit() {
  credentialsError.value = null
  formError.value = null

  const result = loginSchema.safeParse(form)
  if (!result.success) {
    const failed = new Set(result.error.issues.map((issue) => issue.path[0]))
    fieldErrors.value = {
      email: failed.has('email') ? 'Email 格式不正確' : undefined,
      password: failed.has('password') ? '請輸入密碼' : undefined,
    }
    return
  }
  fieldErrors.value = {}

  submitting.value = true
  try {
    await auth.login(result.data)
    await router.push(safeRedirect(route.query.redirect))
  } catch (err) {
    if (err instanceof ApiError && err.code === 'INVALID_CREDENTIALS') {
      credentialsError.value = errorMessage(err)
    } else {
      formError.value = errorMessage(err)
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
        <div class="text-h5 font-weight-bold">歡迎回來</div>
        <div class="text-body-2 text-medium-emphasis mt-1">登入後就能收藏喜歡的景點</div>
      </div>

      <v-form @submit.prevent="submit">
        <AppTextField
          v-model="form.email"
          label="Email"
          type="email"
          autocomplete="email"
          :prepend-inner-icon="mdiEmailOutline"
          :error="!!credentialsError"
          :error-messages="fieldErrors.email"
        />
        <AppTextField
          v-model="form.password"
          label="密碼"
          autocomplete="current-password"
          :type="showPassword ? 'text' : 'password'"
          :prepend-inner-icon="mdiLockOutline"
          :append-inner-icon="showPassword ? mdiEyeOff : mdiEye"
          :error-messages="fieldErrors.password ?? credentialsError ?? undefined"
          @click:append-inner="showPassword = !showPassword"
        />
        <div
          v-if="formError"
          class="text-error text-body-2 mb-2"
        >
          {{ formError }}
        </div>
        <v-btn
          type="submit"
          color="primary"
          size="large"
          block
          class="mt-2"
          :loading="submitting"
        >
          登入
        </v-btn>
      </v-form>

      <div class="text-center mt-4 text-body-2">
        還沒有帳號?
        <router-link :to="{ name: ROUTE_NAME.REGISTER, query: route.query }">註冊</router-link>
      </div>
    </v-card>
  </v-container>
</template>
