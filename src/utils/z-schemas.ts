import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import { z } from 'zod'
import { accounts, tags } from '#/configs/index.js'
import type { transactions } from '#/db/schema.js'
import { formatDate } from '#/utils/index.js'

export type InsertTx = InferInsertModel<typeof transactions>
export type SelectTx = InferSelectModel<typeof transactions>
export type Transaction = SelectTx

export const int = z.coerce.number().int()
export const nat = int.nonnegative()
export const flag = z.boolean().prefault(false)

export const commasArray = <Output, Input>(zod: z.ZodType<Output, Input>) =>
	z.string().transform((v, ctx) =>
		v.split(',').map((v) => {
			const res = zod.safeParse(v)
			if (res.success) return res.data
			ctx.addIssue({
				code: 'custom',
				message: `Invalid value in array: ${v}. ${res.error.issues[0].message}.`,
			})
			return z.NEVER
		}),
	)

export const date = z
	.string()
	.regex(/^(?:\d{4}-)?(?:\d{1,2}-)?\d{1,2}/)
	.transform((v) => {
		const spl = v.split('-').map(Number)
		const date = new Date()
		const day = spl.at(-1)
		if (!day) throw new Error('Unexpected contradiction: missing day')
		const month =
			spl.at(-2) ??
			(day > date.getDate()
				? ((12 + date.getMonth() - 1) % 12) + 1 // date of previous month
				: date.getMonth() + 1) // date of current month
		const year =
			spl.at(-3) ??
			(month * 100 + day > (date.getMonth() + 1) * 100 + date.getDate()
				? date.getFullYear() - 1 // date of previous year
				: date.getFullYear()) // date of current year
		return [year, month, day]
			.map((s) => String(s ?? '').padStart(2, '0'))
			.join('-')
	})
	.pipe(z.iso.date().transform((v) => new Date(v)))

export const amount = z
	.string()
	.regex(/^[\d+-.%*()]+$/)
	.transform((v, ctx) => {
		const res = Function(`return ${v}`)()
		if (typeof res === 'number' && !Number.isNaN(res) && Number.isFinite(res))
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
	date: date.prefault(formatDate(new Date())),
	amount: amount,
	from: account.prefault('NULL'),
	to: account.prefault('NULL'),
	description: z
		.string()
		.optional()
		.transform((v) => (v === '' ? null : v)),
	tag: tag.prefault('NULL'),
})
