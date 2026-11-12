import { z } from 'zod'

// 交通部觀光署「景點」資料(AttractionList.json)裡,我們用到的欄位;其餘欄位忽略
const officialSchema = z.object({
  AttractionID: z.string().min(1),
  AttractionName: z.string().trim().min(1),
  Description: z.string().nullish(),
  PositionLat: z.number().min(-90).max(90),
  PositionLon: z.number().min(-180).max(180),
  PostalAddress: z.object({
    City: z.string().trim().min(1),
    Town: z.string().nullish(),
  }),
  WebsiteURL: z.string().nullish(),
  // 1 免費、0 收費、沒有資料(null)。官方 6,190 筆裡有 5,309 筆沒有資料,
  // 所以「不知道」不能當成「收費」
  IsAccessibleForFree: z.union([z.literal(0), z.literal(1)]).nullish(),
})

// 匯入資料庫用的格式(apps/api/data/attractions.json 的一筆)
export interface AttractionRecord {
  id: string
  name: string
  description: string
  city: string
  town: string
  lat: number
  lon: number
  is_free: boolean | null
  website: string | null
}

export function toAttractionRecord(raw: unknown): AttractionRecord | null {
  const parsed = officialSchema.safeParse(raw)
  if (!parsed.success) return null
  const a = parsed.data
  return {
    id: a.AttractionID,
    name: a.AttractionName,
    description: a.Description ?? '',
    city: a.PostalAddress.City,
    town: a.PostalAddress.Town?.trim() ?? '',
    lat: a.PositionLat,
    lon: a.PositionLon,
    is_free: a.IsAccessibleForFree == null ? null : a.IsAccessibleForFree === 1,
    website: a.WebsiteURL?.trim() || null,
  }
}

// 轉換整份資料:無效的筆數另外回報(不靜默丟掉);依 id 排序,每次產生的檔案內容才穩定、git diff 才看得懂
export function buildAttractionRecords(rawList: unknown[]) {
  const records: AttractionRecord[] = []
  let skipped = 0
  for (const raw of rawList) {
    const record = toAttractionRecord(raw)
    if (record) records.push(record)
    else skipped++
  }
  records.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
  return { records, skipped }
}
