import { confirm } from '@inquirer/prompts'
import { z } from 'zod'

import db from '../src/db'
import { defaultPayer } from '../src/db/config'
import { transactions } from '../src/db/schema'
import { typedObjectKeys, zodObjectInput } from '../src/utils'
import { transactionOpts } from '../src/utils/command-options'
import * as zs from '../src/utils/z-schemas'
import { zodCommand } from '../src/utils/zod-command'

const templates = {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	split: async ({ amount, from, to, ...tx }) => {
		const { totalAmount, accounts, includeSelf } = await zodObjectInput({
			totalAmount: zs.amount.describe('Total amount:'),
			accounts: zs
				.commasArray(zs.account)
				.describe('Accounts to split between:'),
			includeSelf: z.boolean().default(true).describe('Include self:'),
		})
		return [
			{
				amount: totalAmount,
				from: from ?? defaultPayer,
				to: 'NULL' as const,
				...tx,
			},
			...accounts.map((account) => ({
				amount: (
					parseFloat(totalAmount) /
					(accounts.length + (includeSelf ? 1 : 0))
				).toFixed(2),
				from: 'NULL' as const,
				to: account,
				...tx,
			})),
		]
	},
} satisfies Record<
	string,
	(tx: Partial<zs.InsertTx>) => Promise<Omit<zs.InsertTx, 'date'>[]>
>

const getTxs = (
	template: keyof typeof templates,
	tx: Partial<zs.InsertTx>,
): Promise<zs.InsertTx[]> =>
	templates[template](tx).then((txs) =>
		txs.map(({ date, ...tx }) => ({ date: date ?? new Date(), ...tx })),
	)

const template = zodCommand({
	name: 'template',
	description: 'Insert one or more transactions using one a template',
	args: {
		template: z
			.enum(typedObjectKeys(templates))
			.describe('The template to use'),
	},
	opts: transactionOpts,
	action: async ({ template }, tx) => {
		const txs = await getTxs(template, tx)
		console.table(txs)
		const ans = await confirm({
			message: 'Do you want to insert these transactions?',
		})
		if (!ans) return
		await db.insert(transactions).values(txs)
	},
})

export default template
