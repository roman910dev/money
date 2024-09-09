import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import { z } from 'zod'

import type { transactions } from '../db/schema'
import { accounts, tags } from '../db/config'

import { formatDate } from '.'

export type InsertTx = InferInsertModel<typeof transactions>
export type SelectTx = InferSelectModel<typeof transactions>
export type Transaction = SelectTx

export const int = z.coerce.number().int()
export const nat = int.nonnegative()
export const flag = z.boolean().default(false)

export const commasArray = <Output, Def extends z.ZodTypeDef, Input>(
	zod: z.ZodType<Output, Def, Input>,
) =>
	z.string().transform((v, ctx) =>
		v.split(',').map((v) => {
			const res = zod.safeParse(v)
			if (res.success) return res.data
			ctx.addIssue({
				code: 'custom',
				message:
					`Invalid value in array: ${v}. ` +
					res.error.issues[0].message +
					'.',
			})
			return z.NEVER
		}),
	)

export const date = z
	.string()
	.regex(/^(\d{4}-)?\d{1,2}-\d{1,2}/)
	.transform((v) => {
		const spl = v.split('-').map((v) => v.padStart(2, '0'))
		const withYear =
			spl.length === 3 ? spl : [new Date().getFullYear(), ...spl]
		return withYear.join('-')
	})
	.pipe(
		z
			.string()
			.date()
			.transform((v) => new Date(v)),
	)

export const amount = z
	.string()
	.regex(/^[\d+-.%*()]+$/)
	.transform((v, ctx) => {
		const res = Function(`return ${v}`)()
		if (typeof res === 'number' && !isNaN(res) && isFinite(res))
			return res.toFixed(2)
		ctx.addIssue({
			code: 'custom',
			message: 'Invalid amount value.',
		})
		return z.NEVER
	})

const optionalEnum = <T extends string>(values: readonly [T, ...T[]]) =>
	z
		.enum([...values, 'NULL', ''])
		.transform((v) => (['NULL', ''].includes(v) ? null : v) as T | null)

export const account = z.enum(accounts)
export type Account = z.infer<typeof account>

export const tag = optionalEnum(tags)

export const transaction = z.object({
	date: date.default(formatDate(new Date())),
	amount: amount,
	from: account.default('NULL'),
	to: account.default('NULL'),
	description: z
		.string()
		.optional()
		.transform((v) => (v === '' ? null : v)),
	tag: tag.default('NULL'),
})
