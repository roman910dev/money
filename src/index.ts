import { Command } from 'commander'

import balance from './cli/balance.js'
import del from './cli/delete.js'
import exp from './cli/export.js'
import imp from './cli/import.js'
import insert from './cli/insert.js'
import tags from './cli/tags.js'
import template from './cli/template.js'
import test from './cli/test.js'
import txs from './cli/txs.js'

const program = new Command()

program
	.name('money-cli')
	.description('A CLI for tracking your money in a SQLite database')
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
