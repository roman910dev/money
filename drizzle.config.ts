import type { Config } from 'drizzle-kit'

import { dbUrl } from './src/db/config'

export default {
	schema: './src/db/schema.ts',
	out: './drizzle',
	dialect: 'mysql',
	dbCredentials: { url: dbUrl },
} satisfies Config
