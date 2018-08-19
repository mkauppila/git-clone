#! /usr/bin/env ts-node

import { executeInit } from './init'

const [, , ...args] = process.argv

if (args[0] === 'init') {
  console.log('execute init')
  executeInit()
} else {
  console.log(`${args[0]} is not a command`)
}
