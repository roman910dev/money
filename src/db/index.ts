import { drizzle } from 'drizzle-orm/mysql2'
import { createConnection } from 'mysql2'

import { dbUrl } from './config.js'
import * as schema from './schema.js'

const connection = createConnection(dbUrl)
const db = drizzle(connection, { schema, mode: 'default' })

export default db
