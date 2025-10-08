import { readFileSync } from 'node:fs'
import { confirm } from '@inquirer/prompts'
import chalk from 'chalk'
import { z } from 'zod'
import { zodCommand } from 'zod-commander'
import db from '#/db/index.js'
import { transactions } from '#/db/schema.js'
import { delimiter_char } from '#/utils/command-options.js'
import * as zs from '#/utils/z-schemas.js'

const imp = zodCommand({
	name: 'import',
	description: 'Import a CSV file of transactions and add them to the database',
	args: { file: z.string().min(1).describe('The CSV file to import') },
	opts: {
		delimiter_char,
		header: z.boolean().default(false).describe('H;The CSV has a header row'),
		idColumn: z
			.boolean()
			.default(true)
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
			message: [
				`Insert ${insert.length} transactions?`,
				errors.length ? ` (${errors.length} errors)` : '',
			].join(''),
		})
		if (ans) await db.insert(transactions).values(insert)
	},
})

export default imp
