import { input, search } from '@inquirer/prompts'
import chalk from 'chalk'
import Fuse from 'fuse.js'
import { z } from 'zod'
import type { Transaction } from '#/utils/z-schemas.js'

interface FormatNumOptions {
	inv?: boolean
	invSign?: boolean
}

export const formatNum = (
	num: number | string,
	{ inv = false, invSign = false }: FormatNumOptions = {},
) => {
	const n = typeof num === 'string' ? parseFloat(num) : num
	const s = (n * (invSign && inv ? -1 : 1)).toFixed(2)
	const x = n * (inv ? -1 : 1)
	return x < 0 ? chalk.red(s) : x > 0 ? chalk.green(s) : chalk.yellow(s)
}

export function tableNum(num: number | string, opts?: FormatNumOptions) {
	return {
		hAlign: 'right' as const,
		content: formatNum(num, opts),
	}
}

export const typedObjectKeys = <T extends object>(obj: T) =>
	Object.keys(obj) as [keyof T, ...(keyof T)[]]

export const isTruthy = <T>(
	value: T | 0 | '' | null | undefined | false,
): value is T => Boolean(value)

export const formatDate = (date: Date) => date.toISOString().split('T')[0]

export const formatTx = ({ id, date, ...tx }: Transaction) => ({
	id,
	date: formatDate(date),
	...tx,
})

export const z2v =
	<Output, Input>(zod: z.ZodType<Output, Input>) =>
	(value: Input) => {
		const result = zod.safeParse(value)
		return result.success || result.error.issues[0].message
	}

export const zodDefault = <Output, Input>(
	zod: z.ZodType<Output, Input>,
): Input | undefined =>
	zod instanceof z.ZodPipe
		? zodDefault(zod.def.in as z.ZodType<unknown, Input>)
		: zod instanceof z.ZodPrefault
			? (zod.def.defaultValue as Input)
			: undefined

const zodCore = (zod: z.ZodTypeAny): z.ZodTypeAny =>
	'innerType' in zod.def && zod.def.innerType instanceof z.ZodType
		? zodCore(zod.def.innerType)
		: 'schema' in zod && zod.schema instanceof z.ZodType
			? zodCore(zod.schema)
			: zod

const zodIn = (zod: z.ZodTypeAny): z.core.$ZodType => {
	const core = zodCore(zod)
	return 'in' in core.def && core.def.in instanceof z.ZodType
		? zodIn(core.def.in)
		: core
}

export const zodInput = async <Output>(
	message: string,
	zod: z.ZodType<Output, string | undefined>,
) => {
	const zIn = zodIn(zod)
	if (!(zIn instanceof z.ZodEnum))
		return zod.parse(
			await input({
				message,
				validate: z2v(zod),
				required: !zod.isOptional(),
				default: zodDefault(zod),
			}),
		)

	return zod.parse(
		await search({
			message,
			validate: z2v(zod),
			source: (input) => {
				const values = zIn.options.map(String)
				const def = zodDefault(zod)
				if (!input)
					return values
						.slice()
						.sort((a, b) => (a === def ? -1 : b === def ? 1 : 0))
						.map((v) => ({ value: v }))

				const fuse = new Fuse(values)
				return fuse.search(input).map(({ item }) => ({ value: item }))
			},
		}),
	)
}

export const zodObjectInput = async <
	S extends Record<string, z.ZodType<unknown, string | undefined>>,
>(
	shape: S,
) => {
	const obj: Record<string, unknown> = {}
	for (const key in shape) obj[key] = await zodInput(key, shape[key])
	return obj as z.infer<z.ZodObject<S>>
}
