import z from 'zod'
import { zodCommand } from 'zod-commander/zod4'
import templates from '#/configs/templates.js'
import db from '#/db/index.js'
import { transactions } from '#/db/schema.js'
import { transactionStrOpts } from '#/utils/command-options.js'
import { typedObjectKeys, zodObjectInput } from '#/utils/index.js'
import * as zs from '#/utils/z-schemas.js'
import { makeBalancesTable } from './balance.js'

type TxKey = keyof zs.InsertTx
type Template = {
	default?: Partial<Record<TxKey, string>>
	readonly?: Partial<Record<TxKey, string>>
}
export type Templates = Record<string, Template>

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
	opts: {
		...transactionStrOpts,
		template: z
			.enum(typedObjectKeys(templates))
			.optional()
			.describe('t;The name of the template to use to prefill the transaction'),
	},
	async action(_, { template, ...tx }) {
		const tp = template && templates[template]
		const transaction = await zodObjectInput(zs.transaction.shape, {
			default: tp?.default,
			readonly: { ...tp?.readonly, ...tx },
		})
		await db.insert(transactions).values(transaction)
		await afterInsert([transaction])
	},
})

export default insert
