import { execSync } from 'node:child_process'
import pg from 'pg'

// 測試開始前:確保測試資料庫存在,並套用所有 migration
export default async function setup() {
  const url = new URL(
    process.env.TEST_DATABASE_URL ?? 'postgresql://travel:travel@localhost:5432/travel_app_test',
  )
  const dbName = url.pathname.slice(1)

  const admin = new pg.Client({
    connectionString: url.toString().replace(`/${dbName}`, '/postgres'),
  })
  await admin.connect()
  const { rowCount } = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName])
  if (!rowCount) await admin.query(`CREATE DATABASE "${dbName}"`)
  await admin.end()

  execSync('pnpm exec prisma migrate deploy --config prisma7.config.ts', {
    env: { ...process.env, DATABASE_URL: url.toString() },
    stdio: 'inherit',
  })
}
