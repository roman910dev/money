import { asc } from 'drizzle-orm'
import { writeFileSync } from 'fs'
import path from 'path'
import { z } from 'zod'
import { zodCommand } from 'zod-commander'
import db from '#/db/index.js'
import { transactions } from '#/db/schema.js'
import { delimiter_char, orderBy_column } from '#/utils/command-options.js'
import { formatTx } from '#/utils/index.js'

const defaultFile = path.join(
	__dirname,
	`../exports/${new Date().toISOString().split('T')[0]}.csv`,
)

const exp = zodCommand({
	name: 'export',
	description: 'Export the database to CSV',
	args: {
		file: z
			.string()
			.min(1)
			.default(defaultFile)
			.describe('The file to export to'),
	},
	opts: {
		delimiter_char,
		orderBy_column,
	},
	async action({ file }, { delimiter, orderBy }) {
		const txs = await db.query.transactions.findMany({
			orderBy: asc(transactions[orderBy]),
		})
		const csv = txs
			.map((tx) => Object.values(formatTx(tx)).join(delimiter))
			.join('\n')

		writeFileSync(file, csv, 'utf-8')

		console.log('Exported to:')
		console.log(path.resolve(file))
	},
})

export default exp
