#! /usr/bin/env ts-node

import { executeInit } from './init'
import { executeAdd } from './add'
import { executeCommit } from './commit'

const [, , ...args] = process.argv

;(async () => {
  const command = args[0]
  if (command === 'init') {
    console.log('execute init')
    executeInit()
  } else if (command === 'add') {
    const filePath = args[1]
    await executeAdd(filePath)
  } else if (command === 'commit') {
    await executeCommit()
  } else {
    console.log(`${args[0]} is not a command`)
  }
})()
