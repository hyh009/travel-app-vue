import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { useAuthStore } from './stores/auth'
import App from './App.vue'
import router from './router'

import vuetify from './plugins/vuetify'

const app = createApp(App)

app.use(createPinia())
await useAuthStore().restore()
app.use(router)
app.use(vuetify)

app.mount('#app')
