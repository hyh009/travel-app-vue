const MAX_TERMS = 5

// 台灣的 22 個縣市(資料裡用「臺」)
const TAIWAN_CITIES = [
  '臺北市',
  '新北市',
  '桃園市',
  '臺中市',
  '臺南市',
  '高雄市',
  '基隆市',
  '新竹市',
  '嘉義市',
  '新竹縣',
  '苗栗縣',
  '彰化縣',
  '南投縣',
  '雲林縣',
  '嘉義縣',
  '屏東縣',
  '宜蘭縣',
  '花蓮縣',
  '臺東縣',
  '澎湖縣',
  '金門縣',
  '連江縣',
]

// 可能被當成前綴的寫法:完整縣市名(臺北市)與去掉「市/縣」的簡稱(臺北),長的優先
const CITY_PREFIXES = TAIWAN_CITIES.flatMap((city) => [city, city.slice(0, -1)]).sort(
  (a, b) => b.length - a.length,
)

// 切掉縣市之後,剩下的要像鄉鎮名(至少 2 個字、以區/鄉/鎮/市結尾)才算
const TOWN_SUFFIX = /[區鄉鎮市]$/

// 「台北市中正區」沒有空白,整串是一個詞,但它橫跨縣市與鄉鎮兩個欄位,比對不到任何一個。
// 開頭是縣市、後面像鄉鎮時,拆成兩個詞:["台北市", "中正區"]。
// 規則刻意保守,寧可不拆也不要拆錯:「新北投溫泉」「台北101」「台北市立動物園」
// 的剩餘部分都不像鄉鎮,所以不會被拆開
export function splitCityPrefix(term: string): string[] {
  // 台→臺是一對一替換,長度不變,所以可以用同樣的位置切原字串
  const normalized = term.replaceAll('台', '臺')
  for (const prefix of CITY_PREFIXES) {
    if (!normalized.startsWith(prefix)) continue
    const rest = term.slice(prefix.length)
    if (rest.length >= 2 && TOWN_SUFFIX.test(rest)) return [term.slice(0, prefix.length), rest]
  }
  return [term]
}

// 空白切開;每個詞都要符合才算符合(「花蓮 太魯閣」)
export function splitTerms(q: string): string[] {
  return q.split(/\s+/).filter(Boolean).flatMap(splitCityPrefix).slice(0, MAX_TERMS)
}

// 資料用「臺」,使用者常打「台」,兩種寫法都要找得到
export function variantsOf(term: string): string[] {
  return [...new Set([term, term.replaceAll('台', '臺'), term.replaceAll('臺', '台')])]
}

// Prisma 的 contains 不會跳脫 LIKE 的萬用字元,使用者輸入 % 或 _ 要當成一般字元
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&')
}

export function includesTerm(text: string, term: string): boolean {
  const lower = text.toLowerCase()
  return variantsOf(term).some((v) => lower.includes(v.toLowerCase()))
}
