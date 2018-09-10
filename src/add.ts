import * as path from 'path'
import * as crypto from 'crypto'
import * as zlib from 'zlib'
import { addBlobToIndex } from './indexCache';
import fs from './fs'

type GitObjectType = 'blob' | 'tree'

interface TreeObject {
  hash: string
  name: string
  permissons: string
  type: GitObjectType
}

async function writeObject(hash: string, data: Buffer): Promise<void> {
  const directoryName = hash.slice(0, 2)
  const fileName = hash.slice(2, hash.length)
  await fs.mkdir(`./.git/objects/${directoryName}`)
  await fs.writeFile(`./.git/objects/${directoryName}/${fileName}`, data)
}

function hashBuffer(data: Buffer): string {
  const sha = crypto.createHash('sha1')
  sha.update(data)
  return sha.digest('hex')
}

function asGitObject(type: GitObjectType, data: Buffer) {
  return Buffer.concat([Buffer.from(`${type} ${data.length}\0`), data])
}

async function writeBlob(filePath: string) {
  const data = await fs.readFile(filePath) // TODO: add error handling
  const object = asGitObject('blob', data)
  const hash = hashBuffer(object)
  writeObject(hash, zlib.deflateSync(object))

}

async function writeTree(name: string, to: TreeObject) {
  const data = Buffer.concat([
    // VERIFY: the permissions/mode format, why string?
    Buffer.from(`${to.permissons} ${to.name}\0`),
    Buffer.from(to.hash, 'hex'),
  ])

  const blob = asGitObject('tree', data)
  writeObject(hashBuffer(blob), zlib.deflateSync(blob))
}

export async function executeAdd(filePath: string): Promise<void> {
  // TODO: support directories (loop it through and add all)
  await writeBlob(filePath)
}
