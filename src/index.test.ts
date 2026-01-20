import { beforeEach, describe, expect, test } from "bun:test"
import { reset } from "drizzle-seed"
import { testClient } from 'hono/testing'
import _ from 'lodash'
import app from './index'
import { db } from './postgres/index'
import * as schema from './postgres/schema'

describe('GET /health', () => {
  // Create the test client from the app instance
  const client: any = testClient(app)

  test('status ok', async () => {
    const res = await client.health.$get()

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ status: 'ok' })
  })
})

describe('GET /slots', () => {
  // Create the test client from the app instance
  const client: any = testClient(app)

  beforeEach(async () => {
    await reset(db, schema)
  })

  test('no reservation, then get all slots', async () => {
    const res = await client.slots.$get({
      query: { date: '2026-01-20' },
    })

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ 
      available_times: [
        '09:00', 
        '10:00', 
        '11:00', 
        '12:00', 
        '13:00', 
        '14:00', 
        '15:00', 
        '16:00',
      ] 
    })
  })

  test('one reservation, then get free slots', async () => {
    const date = '2026-01-20'
    const user = _.first(await db.insert(schema.User).values({ name: 'Tester' }).returning())
    if (_.isNil(user)) return expect().fail('fail to seed user')
    await db.insert(schema.Booking).values({ 
      userId: user.id,
      date,
      time: '09:00'
    })

    const res = await client.slots.$get({
      query: { date },
    })

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      available_times: [
        '10:00', 
        '11:00', 
        '12:00', 
        '13:00', 
        '14:00', 
        '15:00', 
        '16:00',
      ] 
    })
  })

  test('Invalid date format', async () => {
    const res = await client.slots.$get({
      query: { date: 'abc123' }
    })

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({
      error: 'Invalid date format'
    })
  })
})

describe('POST /bookings', () => {
  // Create the test client from the app instance
  const client: any = testClient(app)

  beforeEach(async () => {
    await reset(db, schema)
  })

  test('200 ok', async () => {
    const [date, time] = ['2026-01-20', '09:00']
    const user = _.first(await db.insert(schema.User).values({ name: 'Tester' }).returning())
    if (_.isNil(user)) return expect().fail('fail to seed user')

    const res = await client.bookings.$post({
      json: { date, time, user_id: `user_${user.id}` },
    })

    expect(res.status).toBe(200)
    expect((await res.json())?.booking_id).toMatch(/booking_\d+/)
  })

  test('Slot full', async () => {
    const [date, time] = ['2026-01-20', '09:00']
    const user1 = _.first(await db.insert(schema.User).values({ name: 'Tester' }).returning())
    if (_.isNil(user1)) return expect().fail('fail to seed user')
    const user2 = _.first(await db.insert(schema.User).values({ name: 'Tester 2' }).returning())
    if (_.isNil(user2)) return expect().fail('fail to seed user')

    const res1 = await client.bookings.$post({
      json: { date, time, user_id: `user_${user1.id}` },
    })

    const res2 = await client.bookings.$post({
      json: { date, time, user_id: `user_${user2.id}` },
    })

    expect(res1.status).toBe(200)
    expect((await res1.json())?.booking_id).toMatch(/booking_\d+/)
    expect(res2.status).toBe(400)
    expect((await res2.json())?.error).toEqual('Slot full')
  })

  test('Shop closed', async () => {
    const [date, time] = ['2026-01-20', '17:00']
    const user = _.first(await db.insert(schema.User).values({ name: 'Tester' }).returning())
    if (_.isNil(user)) return expect().fail('fail to seed user')

    const res = await client.bookings.$post({
      json: { date, time, user_id: `user_${user.id}` },
    })

    expect(res.status).toBe(400)
    expect((await res.json())?.error).toEqual('Shop closed')
  })

  test('User not found', async () => {
    const [date, time] = ['2026-01-20', '09:00']

    const res = await client.bookings.$post({
      json: { date, time, user_id: 'user_1' },
    })

    expect(res.status).toBe(400)
    expect((await res.json())?.error).toEqual('User not found')
  })
})