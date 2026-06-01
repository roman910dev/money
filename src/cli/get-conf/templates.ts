import z from 'zod'
import { zodCommand } from 'zod-commander/zod4'
import templates from '#/configs/templates.js'
import { typedObjectKeys } from '#/utils/index.js'

export default zodCommand({
	name: 'templates',
	description: 'Print the available template details',
	args: {
		template: z
			.enum(typedObjectKeys(templates))
			.optional()
			.describe('The name of the template to print. Omit to print all.'),
	},
	async action({ template }) {
		const res = template ? templates[template] : templates
		console.dir(res, { depth: null })
	},
})
