import Table from 'cli-table3'
import { eq, isNull, sum } from 'drizzle-orm'

import db from '../src/db'
import { accounts } from '../src/db/config'
import { transactions } from '../src/db/schema'
import { tableNum } from '../src/utils'
import * as zs from '../src/utils/z-schemas'
import { zodCommand } from '../src/utils/zod-command'

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
		const balances = await Promise.all(accounts.map(getBalance))
		balances.sort((a, b) => b.balance - a.balance)
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

		console.log(table.toString())
	},
})

export default balance
