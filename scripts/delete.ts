import { confirm, select, Separator } from '@inquirer/prompts'
import { desc, eq, inArray } from 'drizzle-orm'

import db from '../src/db'
import { transactions } from '../src/db/schema'
import { formatTx, } from '../src/utils'
import { toTable } from '../src/utils/to-table'
import * as zs from '../src/utils/z-schemas'
import { zodCommand } from '../src/utils/zod-command'

const del = zodCommand({
	name: 'delete',
	description: 'Delete one or more transactions',
	args: {
		ids: zs
			.commasArray(zs.nat)
			.optional()
			.describe('The IDs of the transactions to delete'),
	},
	opts: {
		limit: zs.nat.describe(
			'The number of transactions to show when no ids are provided',
		),
	},
	async action({ ids }, { limit }) {
		if (ids) {
			const txs = await db.query.transactions.findMany({
				where: inArray(transactions.id, ids),
			})
			console.table(txs.map(formatTx))
			const ans = await confirm({
				message: 'Are you sure you want to delete these transactions?',
			})
			if (ans)
				await db
					.delete(transactions)
					.where(inArray(transactions.id, ids))
		} else {
			const txs = await db.query.transactions.findMany({
				orderBy: desc(transactions.date),
				limit,
			})
			const [header, ...rows] = toTable(txs.map(formatTx))
			const ans = await select({
				message: 'Select a transaction to delete',
				choices: [
					new Separator(' ' + header),
					...rows.map((row, i) => ({
						name: row,
						value: txs[i].id,
					})),
				],
			})
			const ans2 = await confirm({
				message: 'Are you sure you want to delete this transaction?',
			})
			if (ans2)
				await db.delete(transactions).where(eq(transactions.id, ans))
		}
	},
})

export default del
