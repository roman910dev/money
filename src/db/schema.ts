import {
	customType,
	date,
	decimal,
	mysqlTable,
	serial,
	text,
} from 'drizzle-orm/mysql-core'

import { accounts, tags } from './config'

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

export const transactions = mysqlTable('transactions', {
	id: serial('id').primaryKey(),
	date: date('date').notNull(),
	amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
	from: tsEnum('from', { length: 50, values: accounts }).notNull(),
	to: tsEnum('to', { length: 50, values: accounts }).notNull(),
	description: text('description'),
	tag: tsEnum('tag', { length: 50, values: tags }),
})
