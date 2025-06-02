import db from '../src/db'
import { transactions } from '../src/db/schema'
import { zodObjectInput } from '../src/utils'
import * as zs from '../src/utils/z-schemas'
import { zodCommand } from '../src/utils/zod-command'

import { makeBalancesTable } from './balance'

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
