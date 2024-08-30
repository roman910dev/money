import { writeFileSync } from 'fs'

import { asc } from 'drizzle-orm'
import { z } from 'zod'

import db from '../src/db'
import { transactions } from '../src/db/schema'
import { formatTx } from '../src/utils'
import { delimiter_char, orderBy_column } from '../src/utils/command-options'
import { zodCommand } from '../src/utils/zod-command'

const exp = zodCommand({
	name: 'export',
	description: 'Export the database to CSV',
	args: { file: z.string().min(1).describe('The file to export to') },
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
	},
})

export default exp
