import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { config } from './lib/config.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import authRouter from './routes/auth.js'

const app = express()

app.use(cors({ origin: config.webOrigin, credentials: true }))
app.use(express.json())
app.use(cookieParser())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/auth', authRouter)

app.use(notFoundHandler)
app.use(errorHandler)

app.listen(config.port, () => {
  console.log(`API running on http://localhost:${config.port}`)
})
