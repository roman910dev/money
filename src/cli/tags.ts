import Table from 'cli-table3'
import { and, eq, gte, lte, or } from 'drizzle-orm'
import _ from 'lodash'
import { zodCommand } from 'zod-commander'
import db from '#/db/index.js'
import { transactions } from '#/db/schema.js'
import { tableNum } from '#/utils/index.js'
import { date } from '#/utils/z-schemas.js'

const getTagsData = async (fromDate?: Date, toDate?: Date) => {
	const conditions = [
		or(eq(transactions.from, 'NULL'), eq(transactions.to, 'NULL')),
		fromDate && gte(transactions.date, fromDate),
		toDate && lte(transactions.date, toDate),
	]

	const txs = await db.query.transactions.findMany({
		where: and(...conditions),
	})

	const tagStats = _.chain(txs)
		.groupBy('tag')
		.mapValues((transactions) => {
			let earned = 0
			let spent = 0

			for (const tx of transactions) {
				const amount = parseFloat(tx.amount)
				if (tx.from === 'NULL') earned += amount
				if (tx.to === 'NULL') spent += amount
			}

			return { earned, spent, net: earned - spent }
		})
		.value()

	return tagStats
}

const tags = zodCommand({
	name: 'tags',
	description:
		'Show amount spent and earned for each tag (only transactions with null from/to)',
	opts: {
		fromDate: date
			.optional()
			.describe('Filter transactions from this date (inclusive)'),
		toDate: date
			.optional()
			.describe('Filter transactions until this date (inclusive)'),
	},
	async action(_, { fromDate, toDate }) {
		const tagStats = await getTagsData(fromDate, toDate)

		// Calculate totals first to compute percentages
		const totals = Object.values(tagStats).reduce(
			(acc, stats) => ({
				earned: acc.earned + stats.earned,
				spent: acc.spent + stats.spent,
				net: acc.net + stats.net,
			}),
			{ earned: 0, spent: 0, net: 0 },
		)

		const table = new Table({
			head: ['Tag', 'Earned', 'Spent', 'Net', '%'],
			style: { head: ['cyan'] },
		})

		const sortedTags = Object.entries(tagStats).sort(
			([, a], [, b]) => b.net - a.net,
		)

		table.push(
			...sortedTags.map(([tag, stats]) => {
				// Calculate percentage based on net value
				const percentage =
					stats.net > 0 && totals.earned
						? (stats.net / totals.earned) * 100
						: stats.net < 0 && totals.spent
							? (Math.abs(stats.net) / totals.spent) * 100
							: 0

				return [
					tag || '(no tag)',
					tableNum(stats.earned),
					tableNum(stats.spent, { inv: true }),
					tableNum(stats.net),
					`${percentage.toFixed(1)}%`,
				]
			}),
		)

		console.log(table.toString())

		const totalTable = new Table({
			head: ['Total', 'Earned', 'Spent', 'Net', '%'],
			style: { head: ['yellow'] },
		})

		totalTable.push([
			'TOTAL',
			tableNum(totals.earned.toFixed(2)),
			tableNum(totals.spent.toFixed(2), { inv: true }),
			tableNum(totals.net.toFixed(2)),
			'100%',
		])

		console.log(totalTable.toString())
	},
})

export default tags
