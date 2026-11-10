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
          // 深綠:導覽列選取、卡片選取框、按鈕。地圖標記的黃色是另外寫在 utils/map.ts 的
          primary: '#2E6F5E',
          secondary: '#3E8E7E',
          // info 預設是亮藍色,改成和導覽列、地圖標記同一組的深藍灰
          info: '#37474F',
        },
      },
    },
  },
})
