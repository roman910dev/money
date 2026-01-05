import { z } from 'zod'
import * as zs from '#/utils/z-schemas.js'
import { formatDate } from './index.js'

export const delimiter_char = z
	.string()
	.prefault(',')
	.transform((v) => (v === 'TAB' ? '\t' : v))
	.describe('d;The delimiter to use for the CSV')

export const orderBy_column = z
	.enum(['id', 'date'])
	.prefault('id')
	.describe('The column to order by')

export const transactionOpts = {
	date: zs.date
		.prefault(formatDate(new Date()))
		.describe('Override transaction date'),
	amount: zs.amount.optional().describe('Override transaction amount'),
	from_account: zs.account
		.optional()
		.describe('Override transaction from account'),
	to_account: zs.account.optional().describe('Override transaction to account'),
	description: z
		.string()
		.optional()
		.describe('Override transaction description'),
	tag: zs.tag.optional().describe('Override transaction tag'),
}
