import { confirm } from '@inquirer/prompts'
import { z } from 'zod'

import type * as zs from '../src/utils/z-schemas'
import db from '../src/db'
import { transactions } from '../src/db/schema'
import { typedObjectKeys } from '../src/utils'
import { transactionOpts } from '../src/utils/command-options'
import templates from '../src/utils/templates'
import { zodCommand } from '../src/utils/zod-command'

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
