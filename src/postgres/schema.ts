import * as t from "drizzle-orm/pg-core"

export const User = t.pgTable("users", {
  id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
  name: t.varchar({ length: 255 }).notNull(),
})

export const Booking = t.pgTable('bookings', {
  id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: t.integer().references(() => User.id),
  date: t.date().notNull(),
  time: t.time().notNull(),
}, (table) => [
  t.uniqueIndex('date_time_idx').on(table.date, table.time),
])