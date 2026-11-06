import { ref } from 'vue'

interface ToastState {
  show: boolean
  message: string
  type: ToastType
}

type ToastType = 'error' | 'info' | 'success'

const state = ref<ToastState>({
  show: false,
  message: '',
  type: 'success',
})

export function useToast() {
  function show(message: string, toastType: ToastType = 'success') {
    state.value.message = message
    state.value.type = toastType
    state.value.show = true
  }

  return { state, show }
}
