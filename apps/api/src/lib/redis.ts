import { Redis } from 'ioredis'
import { config } from './config.js'

export const redis = new Redis(config.redisUrl, {
  maxRetriesPerRequest: 2,
  // 指令最多等 300ms:Redis 掛掉時,限流檢查會很快放棄、請求照常放行,
  // 不然斷線時指令會一直排隊重試,每個請求要多等好幾秒。
  // (不用 enableOfflineQueue: false:啟動時 Redis 還沒連上,限流器初始化會失敗)
  commandTimeout: 300,
})

redis.on('error', (err) => {
  console.error('[redis]', err.message)
})
