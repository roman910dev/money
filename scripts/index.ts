import { Command } from 'commander'

import balance from './balance'
import del from './delete'
import exp from './export'
import imp from './import'
import insert from './insert'
import template from './template'
import test from './test'
import txs from './txs'

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
	.addCommand(template)
	.addCommand(test)
	.addCommand(txs)
	.parseAsync(process.argv)
	.then(() => process.exit(0))
