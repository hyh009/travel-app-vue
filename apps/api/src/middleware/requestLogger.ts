import type { NextFunction, Request, Response } from 'express'

// 開發用:每個請求結束時印一行「方法 網址 狀態碼 耗時」。
// 錯誤回應會多印出錯誤代碼和 details(由 errorHandler 放進 res.locals.apiError)。
// 請求還沒回完、連線就被客戶端中斷(例如前端取消了 fetch)會標成 ABORTED。
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = process.hrtime.bigint()

  // close 在回應送完、或連線中斷時都會觸發;用 writableFinished 分辨是哪一種
  res.on('close', () => {
    const ms = Number(process.hrtime.bigint() - start) / 1e6
    const status = res.writableFinished ? res.statusCode : 'ABORTED'
    const time = new Date().toLocaleTimeString('zh-TW', { hour12: false })
    console.log(`[api] ${time} ${req.method} ${req.originalUrl} ${status} ${ms.toFixed(0)}ms`)

    const apiError = res.locals.apiError as { code: string; details?: unknown } | undefined
    if (apiError) {
      const details = apiError.details === undefined ? '' : ` ${JSON.stringify(apiError.details)}`
      console.log(`[api]   ↳ ${apiError.code}${details}`)
    }
  })

  next()
}
