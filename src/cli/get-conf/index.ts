import { zodCommand } from 'zod-commander/zod4'
import templates from './templates.js'

export default zodCommand({
	name: 'get-conf',
	description: 'Print details about the configuration',
}).addCommand(templates)
