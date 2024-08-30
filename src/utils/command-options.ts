import { z } from 'zod'

import * as zs from './z-schemas'

export const delimiter_char = z
	.string()
	.default(',')
	.transform((v) => (v === 'TAB' ? '\t' : v))
	.describe('d;The delimiter to use for the CSV')

export const orderBy_column = z
	.enum(['id', 'date'])
	.default('id')
	.describe('The column to order by')

export const transactionOpts = {
	date: zs.date.describe('Override transaction date'),
	amount: zs.amount.describe('Override transaction amount'),
	from_account: zs.account.describe('Override transaction from account'),
	to_account: zs.account.describe('Override transaction to account'),
	description: z.string().describe('Override transaction description'),
	tag: zs.tag.describe('Override transaction tag'),
}
