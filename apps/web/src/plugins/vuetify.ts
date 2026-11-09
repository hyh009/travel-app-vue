import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg'

export default createVuetify({
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: { mdi },
  },
  theme: {
    // Vuetify 4 預設是 'system'(跟著裝置的深色模式)。我們只設計了淺色版,固定用 light
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#F2C14E',
          secondary: '#E9A23B',
          // info 預設是亮藍色,改成和導覽列、地圖標記同一組的深藍灰
          info: '#37474F',
        },
      },
    },
  },
})
