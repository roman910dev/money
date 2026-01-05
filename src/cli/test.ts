import { zodCommand } from 'zod-commander/zod4'
import * as zs from '#/utils/z-schemas.js'

const test = zodCommand({
	name: 'test',
	description: 'Used for some tests',
	opts: {
		id: zs.nat.prefault(1).transform((v) => v + 2),
	},
	async action(_, { id }) {
		console.log(id)
	},
})

export default test
