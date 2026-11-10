import { defineConfig } from 'vitest/config'

// 測試用獨立的資料庫,不會動到開發用的 travel_app。CI 可用 TEST_DATABASE_URL 覆蓋
const DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'postgresql://travel:travel@localhost:5432/travel_app_test'

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    globalSetup: ['src/test/globalSetup.ts'],
    env: { DATABASE_URL, JWT_SECRET: 'test-secret', NODE_ENV: 'test' },
    // 所有測試檔共用同一個資料庫,不能同時跑
    fileParallelism: false,
    // bcrypt cost 12 比較慢
    testTimeout: 15000,
  },
})
