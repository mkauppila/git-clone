import * as path from 'path'
import * as fs from 'fs'

export function readFilesRecursively(filePath: string): string[] {
  return fs.readdirSync(filePath)
    .map(file => {
      const fullPath = path.join(filePath, file)
      if (fs.statSync(fullPath).isDirectory()) {
        return readFilesRecursively(fullPath)
      } else {
        return [fullPath]
      }
    })
    .reduce((all, cur) => all.concat(cur), [])
}
