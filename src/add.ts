import * as crypto from 'crypto'
import * as zlib from 'zlib'
import fs from './fs'

import {
  updateIndexCacheFile,
  addEntryToIndexCache,
  readIndexCacheFile
} from './indexCache'
import { readFilesRecursively } from './files'

type GitObjectType = 'blob' | 'tree'

interface PathHash {
  path: string
  hash: string
}

interface TreeObject {
  hash: string
  name: string
  permissions: string
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

async function writeBlob(path: string): Promise<PathHash> {
  const data = await fs.readFile(path) // TODO: add error handling
  const object = asGitObject('blob', data)
  const hash = hashBuffer(object)
  writeObject(hash, zlib.deflateSync(object))
  return {
    path,
    hash,
  }
}

async function writeTree(name: string, to: TreeObject) {
  const data = Buffer.concat([
    // VERIFY: the permissions/mode format, why string?
    Buffer.from(`${to.permissions} ${to.name}\0`),
    Buffer.from(to.hash, 'hex'),
  ])

  const blob = asGitObject('tree', data)
  writeObject(hashBuffer(blob), zlib.deflateSync(blob))
}

async function fullPathsForFiles(path: string): Promise<string[]> {
  const stat = await fs.lstat(path)
  if (stat.isFile()) {
    return [path]
  } else if (stat.isDirectory()) {
    return readFilesRecursively(path)
  } else {
    // TODO: error on anything else
    return []
  }
}

export async function executeAdd(path: string): Promise<void> {
  await readIndexCacheFile()
  const paths = await fullPathsForFiles(path)
  for (const path of paths) {
    const { path: blobPath, hash } = await writeBlob(path)
    addEntryToIndexCache(blobPath, hash)
  }
  updateIndexCacheFile()
}
