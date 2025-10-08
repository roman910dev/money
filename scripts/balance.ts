import Table from 'cli-table3'
import { eq, isNull, sum } from 'drizzle-orm'
import { zodCommand } from 'zod-commander'
import { accounts } from '#/db/config.js'
import db from '#/db/index.js'
import { transactions } from '#/db/schema.js'
import { tableNum } from '#/utils/index.js'
import * as zs from '#/utils/z-schemas.js'

const getBalance = async (account: zs.Account) => {
	const income =
		(
			await db
				.select({ sum: sum(transactions.amount) })
				.from(transactions)
				.where(
					account === null
						? isNull(transactions.to)
						: eq(transactions.to, account),
				)
		)[0].sum ?? '0'
	const expenses =
		'-' +
		((
			await db
				.select({ sum: sum(transactions.amount) })
				.from(transactions)
				.where(
					account === null
						? isNull(transactions.from)
						: eq(transactions.from, account),
				)
		)[0].sum ?? '0')
	const balance = parseFloat(income) + parseFloat(expenses)
	return { account, income, expenses, balance }
}

interface BalancesTableOptions {
	sort?: boolean
}
export const makeBalancesTable = async (
	accounts: zs.Account[],
	{ sort = false }: BalancesTableOptions = {},
) => {
	const balances = await Promise.all(accounts.map(getBalance))
	if (sort) balances.sort((a, b) => b.balance - a.balance)
	const table = new Table({
		head: ['Account', 'Income', 'Expenses', 'Balance'],
		style: { head: ['cyan'] },
	})
	table.push(
		...balances.map(({ account, income, expenses, balance }) => [
			account,
			...[income, expenses, balance].map((v) => tableNum(v)),
		]),
	)
	return table
}

const balance = zodCommand({
	name: 'balance',
	description: 'Show the balance of one or more accounts',
	args: {
		accounts: zs
			.commasArray(zs.account)
			.default(accounts.join(','))
			.describe('The accounts to show the balance of'),
	},
	async action({ accounts }) {
		const table = await makeBalancesTable(accounts, { sort: true })
		console.log(table.toString())
	},
})

export default balance
