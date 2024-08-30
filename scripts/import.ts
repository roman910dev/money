import { readFileSync } from 'fs'

import { confirm } from '@inquirer/prompts'
import chalk from 'chalk'
import { z } from 'zod'

import db from '../src/db'
import { transactions } from '../src/db/schema'
import { delimiter_char } from '../src/utils/command-options'
import * as zs from '../src/utils/z-schemas'
import { zodCommand } from '../src/utils/zod-command'

const imp = zodCommand({
	name: 'import',
	description:
		'Import a CSV file of transactions and add them to the database',
	args: { file: z.string().min(1).describe('The CSV file to import') },
	opts: {
		delimiter_char,
		header: z
			.boolean()
			.default(false)
			.describe('H;The CSV has a header row'),
		idColumn: z
			.boolean()
			.default(false)
			.describe('i;The CSV has an ID column, which will be ignored'),
	},
	async action({ file }, { delimiter, header, idColumn }) {
		const errors: string[] = []
		const txs = readFileSync(file, 'utf-8')
			.split('\n')
			.slice(header ? 1 : 0)
			.map((line, i) => {
				const [date, amount, from, to, description, tag] = line
					.trim()
					.split(delimiter)
					.map((v) => (v === '' ? undefined : v))
					.slice(idColumn ? 1 : 0)
				console.log(i, date, amount, from, to, description, tag)
				const tx = zs.transaction.safeParse({
					date,
					amount,
					from,
					to,
					description,
					tag,
				})
				if (tx.success) return tx.data
				errors.push(
					`${i.toString().padStart(4)}: ${tx.error.issues[0].message}`,
				)
				return null
			})
		console.table(txs)
		for (const error of errors) console.log(chalk.red(error))
		const insert = txs.filter((tx) => tx !== null)
		const ans = await confirm({
			message:
				`Insert ${insert.length} transactions?` + errors.length
					? ` (${errors.length} errors)`
					: '',
		})
		if (ans) await db.insert(transactions).values(insert)
	},
})

export default imp
