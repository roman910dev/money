import { confirm } from '@inquirer/prompts'
import { z } from 'zod'
import { zodCommand } from 'zod-commander/zod4'
import templates from '#/configs/templates.js'
import db from '#/db/index.js'
import { transactions } from '#/db/schema.js'
import { transactionOpts } from '#/utils/command-options.js'
import { typedObjectKeys } from '#/utils/index.js'
import type * as zs from '#/utils/z-schemas.js'

import { afterInsert } from './insert.js'

type TemplateReturn = Omit<zs.InsertTx, 'date'> & Partial<zs.InsertTx>
export type Templates = Record<
	string,
	| TemplateReturn
	| TemplateReturn[]
	| ((tx: Partial<zs.InsertTx>) => Promise<TemplateReturn[]>)
>

const getTxs = async (
	template: keyof typeof templates,
	tx: Partial<zs.InsertTx> & Pick<zs.InsertTx, 'date'>,
): Promise<zs.InsertTx[]> => {
	const temp = templates[template]
	const txs: TemplateReturn[] =
		typeof temp === 'function'
			? await temp(tx)
			: (Array.isArray(temp) ? temp : [temp]).map((t) => ({
					...t,
					...tx,
				}))
	return txs.map((newTx) => ({ date: tx.date, ...newTx }))
}

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
		await afterInsert(txs)
	},
})

export default template
