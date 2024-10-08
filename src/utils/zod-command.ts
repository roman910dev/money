import {
	Argument,
	Command,
	InvalidArgumentError,
	InvalidOptionArgumentError,
	Option,
} from 'commander'
import kebabCase from 'lodash/kebabCase'
import { z } from 'zod'

import { zodDefault } from '.'

type BeforeFirstUnderscore<S> = S extends `${infer T}_${infer _}` ? T : S

type ReplaceKeyTypes<Type extends z.ZodRawShape> = {
	[Key in keyof Type as BeforeFirstUnderscore<Key>]: Type[Key]
}

type ZodCommandProps<A extends z.ZodRawShape, O extends z.ZodRawShape> = {
	name: string
	description?: string
	args?: A
	opts?: O
	action: (
		args: z.infer<z.ZodObject<A>>,
		opts: z.infer<z.ZodObject<ReplaceKeyTypes<O>>>,
	) => Promise<void> | void
}

const zodCore = <T>(zod: z.ZodTypeAny, fn: (zod: z.ZodTypeAny) => T) => {
	const types = [z.ZodDefault, z.ZodNullable, z.ZodOptional]
	for (const type of types)
		if (zod instanceof type) return zodCore(zod._def.innerType, fn)
	if (zod instanceof z.ZodEffects) return zodCore(zod._def.schema, fn)
	return fn(zod)
}

const zodEnumVals = (zod: z.ZodTypeAny) =>
	zodCore(zod, (zod) => (zod instanceof z.ZodEnum ? zod._def.values : null))

const zodIsBoolean = (zod: z.ZodTypeAny) =>
	zodCore(zod, (zod) => (zod instanceof z.ZodBoolean ? true : false))

const zodParser = (zod: z.ZodTypeAny, opt?: 'opt') => (value: string) => {
	const result = zod.safeParse(value)
	if (result.success) return result.data
	const msg = result.error.issues[0].message
	if (opt) throw new InvalidOptionArgumentError(msg)
	throw new InvalidArgumentError(msg)
}

export const zodArgument = (key: string, zod: z.ZodTypeAny) => {
	const flag = zod.isOptional() ? `[${key}]` : `<${key}>`
	const arg = new Argument(flag, zod.description).argParser(zodParser(zod))
	if (zodDefault(zod)) arg.default(zod.parse(zodDefault(zod)))
	const choices = zodEnumVals(zod)
	if (choices) arg.choices(choices)
	return arg
}

export const zodOption = (key: string, zod: z.ZodTypeAny) => {
	const abbr = zod.description?.match(/^(\w);/)?.[1]
	const description = abbr ? zod.description.slice(2) : zod.description
	const arg = key.includes('_') ? key.split('_').slice(1).join('-') : key
	if (key.includes('_')) [key] = key.split('_')
	key = kebabCase(key)
	const isBoolean = zodIsBoolean(zod)
	const flag =
		`--${key}` +
		(isBoolean ? '' : zod.isOptional() ? ` [${arg}]` : ` <${arg}>`)
	const flags = abbr ? `-${abbr}, ${flag}` : flag
	const opt = new Option(flags, description).argParser(zodParser(zod, 'opt'))
	if (zodDefault(zod)) opt.default(zod.parse(zodDefault(zod)))
	if (isBoolean) opt.optional = true
	const choices = zodEnumVals(zod)
	if (choices) opt.choices(choices)
	return opt
}

export const zodCommand = <A extends z.ZodRawShape, O extends z.ZodRawShape>({
	name,
	description,
	args,
	opts,
	action,
}: ZodCommandProps<A, O>) => {
	const command = new Command(name)
	if (description) command.description(description)
	for (const key in args) command.addArgument(zodArgument(key, args[key]))
	for (const key in opts) command.addOption(zodOption(key, opts[key]))
	command.action(async (...all) => {
		const resultArgs = Object.fromEntries(
			Object.keys(args ?? {}).map((key, i) => [key, all[i]]),
		) as z.infer<z.ZodObject<A>>
		const resultOpts = all[Object.keys(args ?? {}).length] as z.infer<
			z.ZodObject<ReplaceKeyTypes<O>>
		>
		await action(resultArgs, resultOpts)
	})
	command.configureHelp({ showGlobalOptions: true })
	return command
}
