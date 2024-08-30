import * as zs from '../src/utils/z-schemas'
import { zodCommand } from '../src/utils/zod-command'

const test = zodCommand({
	name: 'test',
	description: 'Used for some tests',
	opts: {
		id: zs.nat.default(1).transform((v) => v + 2),
	},
	async action(_,{ id }) {
		console.log(id)
	},
})

export default test
