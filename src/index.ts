import 'dotenv/config'

import { eq, and } from "drizzle-orm"
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import _ from 'lodash'
import { z, ZodError } from 'zod'
import { db } from './postgres'
import { Booking, User } from './postgres/schema'

const app = new Hono()

app.use(logger())
app.use(prettyJSON())

app.onError((error, c) => {
  if (error instanceof HTTPException) {
    console.error(error)
    if (!_.isNil(error.cause)) console.error(error.cause)
    return c.json({ error: error.message }, error.status)
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

app.get('/slots', async c => {
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

app.post('/bookings', async c => {
  const validator = z.object({
    userId: z.templateLiteral(['user_', z.int().positive()], { error: 'Invalid user id' }).transform(str => _.toInteger(str.slice(5))),
    date: z.iso.date({ error: 'Invalid date format' }),
    time: z.enum(BOOKING_TIME_SLOT, { error: 'Shop closed' }),
  })
  const rawBody = await c.req.json()
  console.log(rawBody)
  const args = validator.parse({
    ...rawBody,
    userId: rawBody.user_id,
  })
  console.log(args)

  const user = await db.select({ id: User.id }).from(User).where(eq(User.id, args.userId))
  console.log(user)
  if (_.isNil(user[0])) throw new HTTPException(400, { message: 'User not found' })

  const inserted = await db.transaction(async tx => {
    const isBooked = (await tx.select({ id: Booking.id }).from(Booking).where(and(
      eq(Booking.date, args.date), 
      eq(Booking.time, args.time),
    )))?.length > 0
    if (isBooked) throw new HTTPException(400, { message: 'Slot full' })

    const inserted = _.first(await tx.insert(Booking).values(args).returning({ id: Booking.id }))
    if (_.isNil(inserted)) throw new HTTPException(500, { message: 'Failed to insert to bookings' })
    return inserted
  }, { accessMode: 'read write' })

  return c.json({ booking_id: `booking_${inserted.id}` })
})

export default app
