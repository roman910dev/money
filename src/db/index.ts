import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { dbUrl } from '../configs/index.js'
import * as schema from './schema.js'

const client = createClient({ url: dbUrl })
const db = drizzle({ client, schema })

export default db
