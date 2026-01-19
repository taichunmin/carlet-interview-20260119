import 'dotenv/config'

import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'

const app = new Hono()

app.use(logger())
app.use(prettyJSON())

app.get('/health', (c) => {
  return c.json({ status: 'ok' })
})

export default app
