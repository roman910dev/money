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
	<Output, Def extends z.ZodTypeDef, Input>(
		zod: z.ZodType<Output, Def, Input>,
	) =>
	(value: Input) => {
		const result = zod.safeParse(value)
		return result.success || result.error.issues[0].message
	}

export const zodDefault = <Output, Def extends z.ZodTypeDef, Input>(
	zod: z.ZodType<Output, Def, Input>,
): Input | undefined =>
	zod instanceof z.ZodEffects
		? zodDefault(zod._def.schema)
		: zod instanceof z.ZodDefault
			? zod._def.defaultValue()
			: undefined

const zodCore = (zod: z.ZodTypeAny): z.ZodTypeAny =>
	'innerType' in zod._def && zod._def.innerType instanceof z.ZodType
		? zodCore(zod._def.innerType)
		: 'schema' in zod._def && zod._def.schema instanceof z.ZodType
			? zodCore(zod._def.schema)
			: zod

export const zodInput = async <Output, Def extends z.ZodTypeDef>(
	message: string,
	zod: z.ZodType<Output, Def, string | undefined>,
) => {
	const core = zodCore(zod)
	if (!(core instanceof z.ZodEnum))
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
				const values = core._def.values as string[]
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

export const zodObjectInput = async <S extends z.ZodRawShape>(shape: S) => {
	const obj: Record<string, unknown> = {}
	for (const key in shape) obj[key] = await zodInput(key, shape[key])
	return obj as z.infer<z.ZodObject<S>>
}
