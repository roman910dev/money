import db from '#/db/index.js'
import { transactions } from '#/db/schema.js'
import { orderBy_column } from '#/utils/command-options.js'
import { csvTable } from '#/utils/csv-table.js'
import { formatDate, tableNum } from '#/utils/index.js'
import * as zs from '#/utils/z-schemas.js'
import Table from 'cli-table3'
import { asc, eq, or } from 'drizzle-orm'
import _ from 'lodash'
import { zodCommand } from 'zod-commander'

function insertDividers(txs: zs.Transaction[]) {
	for (let i = 1; i < txs.length; i++) {
		if (txs[i - 1].date.getMonth() !== txs[i].date.getMonth()) {
			const tx = {
				id: 0,
				date: new Date(
					[
						`${txs[i].date.getFullYear()}`,
						`${txs[i].date.getMonth() + 1}`,
						'01',
					].join('-'),
				),
				amount: '0',
				from: 'NULL' as const,
				to: 'NULL' as const,
				description: '----------',
				tag: null,
			}
			txs.splice(i, 0, tx)
		}
	}
}

const txs = zodCommand({
	name: 'txs',
	description: 'Show transactions',
	args: {
		account: zs.account
			.optional()
			.describe('The account to show the transactions of'),
	},
	opts: {
		orderBy_column: orderBy_column.default('date'),
		dividers: zs.flag.describe('Include month dividers'),
		summary: zs.flag.describe('Show a balance summary at the end'),
		csv: zs.flag.describe('Format the output in CSV'),
	},
	async action({ account }, { orderBy, dividers, summary, csv }) {
		const acc = account ?? 'NULL'
		const txs = await db.query.transactions.findMany({
			where: or(eq(transactions.from, acc), eq(transactions.to, acc)),
			orderBy: asc(transactions[orderBy]),
		})
		let balance = 0
		const head = [
			'Id',
			'Date',
			'Amount',
			'From',
			'To',
			'Description',
			'Tag',
			'Balance',
		]
		const table = new Table({ head, style: { head: ['cyan'] } })

		if (dividers || summary) insertDividers(txs)
		const rows = txs.map((tx) => {
			const amount = parseFloat(tx.amount)
			const neg = (!account ? tx.to : tx.from) === acc
			balance += neg ? -amount : amount
			return [
				tx.id,
				formatDate(tx.date),
				tableNum(tx.amount, { invColor: neg }),
				tx.from,
				tx.to,
				tx.description,
				tx.tag,
				tableNum(balance),
			]
		})
		table.push(...rows)
		console.log(
			csv ? csvTable(table, { delimeter: ';' }) : table.toString(),
		)

		if (summary) {
			const summary = new Table({
				head: ['Date', 'Balance'],
				style: { head: ['cyan'] },
			})
			summary.push(
				...[...rows.filter(([id]) => !id), _.last(rows)].map((row) => [
					row?.[1],
					_.last(row),
				]),
			)
			console.log(summary.toString())
		}
	},
})

export default txs
