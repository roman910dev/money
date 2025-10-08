import { customType, int, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { accounts, tags } from '../configs/index.js'

type TsEnumConfig<T extends string> = {
	length: number
	values: readonly [T, ...T[]]
}

const tsEnum = <T extends string>(
	name: string,
	{ length, values }: TsEnumConfig<T>,
) =>
	customType<{
		data: (typeof values)[number]
		driverData: (typeof values)[number]
		default: false
	}>({
		dataType: () => `VARCHAR(${length})`,
		toDriver: (value) => {
			if (value && !values.includes(value))
				throw new Error(`Invalid value: ${value}`)
			return value
		},
	})(name)

const date = customType<{
	data: Date
	driverData: string
	default: false
}>({
	dataType: () => 'TEXT',
	toDriver: (value) => value.toISOString(),
	fromDriver: (value) => new Date(value),
})

const decimal = (name: string, { scale = 2 }: { scale?: number } = {}) =>
	customType<{
		data: string
		driverData: number
		default: false
	}>({
		dataType: () => 'INTEGER',
		toDriver: (value) => Math.round(Number(value) * 10 ** scale),
		fromDriver: (value) => (value / 10 ** scale).toString(),
	})(name)

export const transactions = sqliteTable('transactions', {
	id: int('id').primaryKey({ autoIncrement: true }),
	date: date('date').notNull(),
	amount: decimal('amount', { scale: 2 }).notNull(),
	from: tsEnum('from', { length: 50, values: accounts }).notNull(),
	to: tsEnum('to', { length: 50, values: accounts }).notNull(),
	description: text('description'),
	tag: tsEnum('tag', { length: 50, values: tags }),
})
