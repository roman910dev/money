import { Command } from 'commander'

import balance from './balance.js'
import del from './delete.js'
import exp from './export.js'
import imp from './import.js'
import insert from './insert.js'
import tags from './tags.js'
import template from './template.js'
import test from './test.js'
import txs from './txs.js'

const program = new Command()

program
	.name('money-cli')
	.description('A CLI for tracking your money in a MySQL database')
	.version('0.0.1')
	.addCommand(balance)
	.addCommand(del)
	.addCommand(exp)
	.addCommand(imp)
	.addCommand(insert)
	.addCommand(tags)
	.addCommand(template)
	.addCommand(test)
	.addCommand(txs)
	.parseAsync(process.argv)
	.then(() => process.exit(0))
