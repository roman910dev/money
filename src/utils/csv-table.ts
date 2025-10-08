import type { Table } from 'cli-table3'

interface ToCSVOptions {
	encapsulator?: string
	delimeter?: string
	lineSeparator?: string
}

// // Implement the toCSV method
export const csvTable = (table: Table, opts: ToCSVOptions = {}) => {
	const { lineSeparator = '\n', encapsulator = '', delimeter = ',' } = opts
	return [table.options.head, ...table]
		.map((row) =>
			typeof row.map === 'function'
				? row
						.map((v) =>
							['', v && typeof v === 'object' ? v.content : v, ''].join(
								encapsulator,
							),
						)
						.join(delimeter)
				: row,
		)
		.join(lineSeparator)
}
