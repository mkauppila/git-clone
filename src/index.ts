#! /usr/bin/env ts-node

import { executeInit } from './init'
import { executeAdd } from './add'

const [, , ...args] = process.argv

const main = async () => {
  const command = args[0]
  if (command === 'init') {
    console.log('execute init')
    executeInit()
  } else if (command === 'add') {
    const filePath = args[1]
    await executeAdd(filePath)
  } else {
    console.log(`${args[0]} is not a command`)
  }
}

main()
