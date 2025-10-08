import type { Config } from 'drizzle-kit'

import { dbUrl } from './src/configs/index.js'

export default {
	schema: './src/db/schema.ts',
	out: './drizzle',
	dialect: 'sqlite',
	dbCredentials: { url: dbUrl },
} satisfies Config
