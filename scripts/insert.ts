import db from '#/db/index.js'
import { transactions } from '#/db/schema.js'
import { zodObjectInput } from '#/utils/index.js'
import * as zs from '#/utils/z-schemas.js'
import { zodCommand } from 'zod-commander'

import { makeBalancesTable } from './balance.js'

export const afterInsert = async (
	transactions: Pick<zs.Transaction, 'from' | 'to'>[],
) => {
	const accounts = new Set(transactions.flatMap((tx) => [tx.from, tx.to]))
	const table = await makeBalancesTable(Array.from(accounts))
	console.log(table.toString())
}

const insert = zodCommand({
	name: 'insert',
	description: 'Insert a transaction into the money database',
	async action() {
		const transaction = await zodObjectInput(zs.transaction._def.shape())
		await db.insert(transactions).values(transaction)
		await afterInsert([transaction])
	},
})

export default insert
