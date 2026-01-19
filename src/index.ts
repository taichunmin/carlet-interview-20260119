import 'dotenv/config'

import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { z, ZodError } from 'zod'
import { db } from './postgres'
import { Booking, User } from './postgres/schema'
import { eq } from "drizzle-orm"
import _ from 'lodash'

const app = new Hono()

app.use(logger())
app.use(prettyJSON())

app.onError((error, c) => {
  if (error instanceof HTTPException) {
    console.error(error.cause)
    return error.getResponse()
  }
  if (error instanceof ZodError) {
    console.error(error)
    return c.json({ error: error.issues?.[0]?.message }, 400)
  }
  console.log(error)
  return c.json({ error: error.message }, 500)
})

app.get('/health', (c) => {
  return c.json({ status: 'ok' })
})

const BOOKING_TIME_SLOT = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00']

app.get('/slots', async (c, next) => {
  const validator = z.object({
    date: z.iso.date({ error: 'Invalid date format' }),
  })
  const args = validator.parse({ date: c.req.query('date') })
  const bookings = await db.select({ time: Booking.time }).from(Booking).where(eq(Booking.date, args.date))
  const res = {
    available_times: _.difference(BOOKING_TIME_SLOT, _.map(bookings, 'time'))
  }
  return c.json(res)
})

export default app
