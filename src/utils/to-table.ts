interface ToTableOptions {
	noHeader?: boolean
	sizes?: number[]
}

export const tableSizes = <T extends Record<string, unknown>>(
	data: T[],
	{ noHeader = false }: Omit<ToTableOptions, 'sizes'> = {},
)=> {
	if (!data.length) return []
	const keys = Object.keys(data[0])
	return keys.map((key) => {
		const values = data.map((row) => row[key])
		return Math.max(
			noHeader ? 0 : key.length,
			...values.map((v) => String(v).length),
		)
	})
}

export const toTable = <T extends Record<string, unknown>>(
	data: T[],
	{ noHeader = false, sizes }: ToTableOptions = {},
) => {
	if (!data.length) return ['']
	const keys = Object.keys(data[0])
	const values = data.map((row) => Object.values(row))
	const lengths = sizes ?? tableSizes(data, { noHeader })
	return [...(noHeader ? [] : [keys]), ...values].map((row) => {
		return row
			.map((value, i) => String(value).padEnd(lengths[i]))
			.join('  ')
	})
}
