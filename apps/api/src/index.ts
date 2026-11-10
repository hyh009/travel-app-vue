import { app } from './app.js'
import { config } from './lib/config.js'

app.listen(config.port, () => {
  console.log(`API running on http://localhost:${config.port}`)
})
