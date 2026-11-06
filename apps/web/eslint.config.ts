import { fileURLToPath } from 'node:url'
import { globalIgnores } from 'eslint/config'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'
import pluginOxlint from 'eslint-plugin-oxlint'
import skipFormatting from 'eslint-config-prettier/flat'

// To allow more languages other than `ts` in `.vue` files, uncomment the following lines:
// import { configureVueProject } from '@vue/eslint-config-typescript'
// configureVueProject({ scriptLangs: ['ts', 'tsx'] })
// More info at https://github.com/vuejs/eslint-config-typescript/#advanced-setup

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{vue,ts,mts,tsx}'],
  },

  globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**']),

  ...pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,

  ...pluginOxlint.buildFromOxlintConfigFile('.oxlintrc.json'),

  skipFormatting,

  {
    languageOptions: {
      parserOptions: { tsconfigRootDir: fileURLToPath(new URL('.', import.meta.url)) },
    },
  },

  {
    name: 'app/vue-rules',
    rules: {
      // 模板用了沒 import 的元件時報錯(Vuetify 與 router 的元件是全域註冊,排除)
      'vue/no-undef-components': ['error', { ignorePatterns: ['^v-', '^router-'] }],
      // 屬性順序統一(v-for/v-if → ref/key → v-model → 一般屬性 → 事件)
      'vue/attributes-order': 'error',
    },
  },

  {
    name: 'app/import-style',
    rules: {
      // 跨資料夾一律用 @/ 別名;只有同資料夾的 ./xxx 可以用相對路徑
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../*', './*/*'],
              message: '跨資料夾請使用 @/ 別名,例如 @/composables/useToast',
            },
          ],
        },
      ],
    },
  },
)
