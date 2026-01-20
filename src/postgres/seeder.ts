import { reset, seed } from "drizzle-seed"
import { db } from './index'
import * as schema from './schema'

await (async () => {
  await reset(db, schema)
  await seed(db, { User: schema.User }).refine(f => ({
    User: {
      columns: {
        name: f.firstName(),
      },
    },
  }))
})()