import { confirm } from '@inquirer/prompts'
import { z } from 'zod'
import { zodCommand } from 'zod-commander/zod4'
import workflows from '#/configs/workflows.js'
import db from '#/db/index.js'
import { transactions } from '#/db/schema.js'
import { transactionOpts } from '#/utils/command-options.js'
import { typedObjectKeys } from '#/utils/index.js'
import type * as zs from '#/utils/z-schemas.js'
import { afterInsert } from './insert.js'

type WorkflowReturn = Omit<zs.InsertTx, 'date'> & Partial<zs.InsertTx>
type Workflow = (tx: Partial<zs.InsertTx>) => Promise<WorkflowReturn[]>
export type Workflows = Record<string, Workflow>

const getTxs = async (
	workflow: keyof typeof workflows,
	tx: Partial<zs.InsertTx> & Pick<zs.InsertTx, 'date'>,
): Promise<zs.InsertTx[]> => {
	const txs: WorkflowReturn[] = await workflows[workflow](tx)
	return txs.map((newTx) => ({ date: tx.date, ...newTx }))
}

const workflow = zodCommand({
	name: 'workflow',
	description: 'Insert one or more transactions using one a workflow',
	args: {
		workflow: z
			.enum(typedObjectKeys(workflows))
			.describe('The workflow to use'),
	},
	opts: transactionOpts,
	action: async ({ workflow }, tx) => {
		const txs = await getTxs(workflow, tx)
		console.table(txs)
		const ans = await confirm({
			message: 'Do you want to insert these transactions?',
		})
		if (!ans) return
		await db.insert(transactions).values(txs)
		await afterInsert(txs)
	},
})

export default workflow
