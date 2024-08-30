import { input } from '@inquirer/prompts'
import chalk from 'chalk'
import { z } from 'zod'

import type { Transaction } from './z-schemas'

interface FormatNumOptions {
	invColor: boolean
}

export const formatNum = (
	num: number | string,
	{ invColor }: FormatNumOptions = { invColor: false },
) => {
	const n = typeof num === 'string' ? parseFloat(num) : num
	const s = n.toFixed(2)
	const x = n * (invColor ? -1 : 1)
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
): Input =>
	zod instanceof z.ZodEffects
		? zodDefault(zod._def.schema)
		: zod instanceof z.ZodDefault
			? zod._def.defaultValue()
			: undefined

export const zodInput = async <Output, Def extends z.ZodTypeDef>(
	message: string,
	zod: z.ZodType<Output, Def, string | undefined>,
) =>
	zod.parse(
		await input({
			message,
			validate: z2v(zod),
			required: !zod.isOptional(),
			default: zodDefault(zod),
		}),
	)

export const zodObjectInput = async <S extends z.ZodRawShape>(shape: S) => {
	const obj: Record<string, unknown> = {}
	for (const key in shape) {
		obj[key] = await zodInput(key, shape[key])
	}
	return obj as z.infer<z.ZodObject<S>>
}
