<script setup lang="ts">
import { reactive, ref } from 'vue'
import { ApiError } from '@/api/error'
import { useAuthStore } from '@/stores/auth'
import { errorMessage } from '@/utils/errorMessages'
import { mdiEmailOutline, mdiEye, mdiEyeOff, mdiLockOutline } from '@mdi/js'
import { useRouter } from 'vue-router'
import { ROUTE_NAME } from '@/router'

const auth = useAuthStore()
const router = useRouter()

const form = reactive({ email: '', password: '' })
const formError = ref<string | null>(null)
const submitting = ref(false)
const showPassword = ref(false)

async function submit() {
  formError.value = null
  submitting.value = true
  try {
    await auth.login(form)
    await router.push({ name: ROUTE_NAME.HOME })
  } catch (err) {
    formError.value = errorMessage(err)
    if (!(err instanceof ApiError)) console.error(err)
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
        <v-text-field
          v-model="form.email"
          label="Email"
          type="email"
          variant="outlined"
          autocomplete="email"
          :prepend-inner-icon="mdiEmailOutline"
          :error="!!formError"
        />
        <v-text-field
          v-model="form.password"
          label="密碼"
          variant="outlined"
          autocomplete="current-password"
          :type="showPassword ? 'text' : 'password'"
          :prepend-inner-icon="mdiLockOutline"
          :append-inner-icon="showPassword ? mdiEyeOff : mdiEye"
          :error-messages="formError ?? undefined"
          @click:append-inner="showPassword = !showPassword"
        />
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
    </v-card>
  </v-container>
</template>
