import * as fs from 'fs'

export function executeInit() {
  [
    '.git',
    '.git/objects',
    '.git/objects/info',
    '.git/objects/pack',
    '.git/refs/',
    '.git/refs/heads',
    '.git/refs/tags',
    '.git/info',
    '.git/hooks'
  ]
  .forEach(filePath => {
    console.log(`create folder ${process.cwd()}/${filePath}`)
    fs.mkdirSync(`${process.cwd()}/${filePath}`, '744')
  })

  let contents = `
  [core]
       repositoryformatversion = 0
       filemode = true
       bare = false
       logallrefupdates = true
       ignorecase = true
       precomposeunicode = true
  `
  fs.writeFileSync(`${process.cwd()}/.git/config`, contents, { encoding: 'utf-8'} )
}
