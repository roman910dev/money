import db from '../src/db'
import { transactions } from '../src/db/schema'
import { zodObjectInput } from '../src/utils'
import * as zs from '../src/utils/z-schemas'
import { zodCommand } from '../src/utils/zod-command'

const insert = zodCommand({
	name: 'insert',
	description: 'Insert a transaction into the money database',
	async action() {
		const transaction = await zodObjectInput(zs.transaction._def.shape())
		await db.insert(transactions).values(transaction)
	},
})

export default insert
