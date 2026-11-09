import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { config } from './lib/config.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import authRouter from './routes/auth.js'
import favoritesRouter from './routes/favorites.js'
import placesRouter from './routes/places.js'

const app = express()

app.use(cors({ origin: config.webOrigin, credentials: true }))
app.use(express.json())
app.use(cookieParser())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/auth', authRouter)
app.use('/api/places', placesRouter)
app.use('/api/favorites', favoritesRouter)

// 正式環境由 Express 一併提供打包好的網頁,前後端同一個網址(cookie 不會跨站)
if (config.isProd) {
  const webDist = fileURLToPath(new URL('../../web/dist', import.meta.url))
  app.use(express.static(webDist))
  // 前端路由(例如 /favorites)重新整理時,要回傳 index.html。
  // /api 底下、以及有副檔名的檔案(找不到的 .js、.css)仍然走 404,不要回 HTML 讓瀏覽器誤當成程式碼
  app.get(/^\/(?!api\/)(?!.*\.\w+$).*/, (_req, res) => {
    res.sendFile(path.join(webDist, 'index.html'))
  })
}

app.use(notFoundHandler)
app.use(errorHandler)

app.listen(config.port, () => {
  console.log(`API running on http://localhost:${config.port}`)
})
