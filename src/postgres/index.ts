import 'dotenv/config'

import { drizzle } from 'drizzle-orm/node-postgres'

const POSTGRES_URL: string = process.env.POSTGRES_URL!

export const db = drizzle(POSTGRES_URL)