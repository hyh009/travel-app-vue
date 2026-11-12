import { readFile, writeFile } from 'node:fs/promises'
import { buildAttractionRecords } from '../lib/officialAttraction.js'

// 把交通部觀光署的 AttractionList.json 轉成專案匯入用的 data/attractions.json。
// 用法(下載與解壓縮見 README「更新景點資料」):
//   pnpm --filter api db:build-data <AttractionList.json 的路徑>
const OUTPUT = new URL('../../data/attractions.json', import.meta.url)
const BOM = 0xfeff

async function main() {
  const input = process.argv[2]
  if (!input) throw new Error('請指定 AttractionList.json 的路徑')

  // 官方檔案開頭有 BOM,JSON.parse 會失敗,要先去掉
  const raw = await readFile(input, 'utf-8')
  const text = raw.charCodeAt(0) === BOM ? raw.slice(1) : raw
  const list = JSON.parse(text).Attractions
  if (!Array.isArray(list)) throw new Error('找不到 Attractions 陣列,檔案格式不對?')

  const { records, skipped } = buildAttractionRecords(list)

  // 一筆一行:資料更新時 git diff 才看得出哪幾筆變了
  const body = records.map((r) => `  ${JSON.stringify(r)}`).join(',\n')
  await writeFile(OUTPUT, `[\n${body}\n]\n`)

  const known = records.filter((r) => r.is_free !== null).length
  console.log(`官方 ${list.length} 筆 → 寫入 ${records.length} 筆(略過無效 ${skipped} 筆)`)
  console.log(`有免費/收費資料:${known} 筆;未知:${records.length - known} 筆`)
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
