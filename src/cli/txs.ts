import Table from 'cli-table3'
import { asc, eq, or } from 'drizzle-orm'
import _ from 'lodash'
import { zodCommand } from 'zod-commander/zod4'
import db from '#/db/index.js'
import { transactions } from '#/db/schema.js'
import { orderBy_column } from '#/utils/command-options.js'
import { csvTable } from '#/utils/csv-table.js'
import { formatDate, isTruthy, tableNum } from '#/utils/index.js'
import * as zs from '#/utils/z-schemas.js'

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
		orderBy_column: orderBy_column.prefault('date'),
		dividers: zs.flag.describe('Include month dividers'),
		summary: zs.flag.describe('Show a balance summary at the end'),
		csv: zs.flag.describe('Format the output in CSV'),
		pretty: zs.flag.describe(
			'Use pretty format that can be used to show results to non-technical people',
		),
	},
	async action({ account }, { orderBy, dividers, summary, csv, pretty }) {
		const acc = account ?? 'NULL'
		const txs = await db.query.transactions.findMany({
			where: or(eq(transactions.from, acc), eq(transactions.to, acc)),
			orderBy: asc(transactions[orderBy]),
		})
		let balance = 0
		const head = [
			!pretty && 'Id',
			'Date',
			'Amount',
			!pretty && 'From',
			!pretty && 'To',
			'Description',
			'Tag',
			'Balance',
		].filter(isTruthy)
		const table = new Table({ head, style: { head: ['cyan'] } })

		if (dividers || summary) insertDividers(txs)
		const rows = txs.map((tx) => {
			const amount = parseFloat(tx.amount)
			const neg = (!account ? tx.to : tx.from) === acc
			balance += neg ? -amount : amount
			return [
				!pretty && tx.id,
				formatDate(tx.date),
				tableNum(tx.amount, { inv: neg, invSign: pretty }),
				!pretty && tx.from,
				!pretty && tx.to,
				tx.description ?? ' ',
				tx.tag ?? ' ',
				tableNum(balance),
			].filter(isTruthy)
		})
		table.push(...rows)
		console.log(csv ? csvTable(table, { delimeter: ';' }) : table.toString())

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
