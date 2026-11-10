const MAX_TERMS = 5

// 空白切開;每個詞都要符合才算符合(「花蓮 太魯閣」)
export function splitTerms(q: string): string[] {
  return q.split(/\s+/).filter(Boolean).slice(0, MAX_TERMS)
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
