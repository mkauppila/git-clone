import * as crypto from 'crypto'
import * as zlib from 'zlib'
import fs from './fs'
import * as path from 'path'

import {
  updateIndexCacheFile,
  addEntryToIndexCache,
  readIndexCacheFile,
  EntryInfo
} from './indexCache'
import { readFilesRecursively } from './files'

type GitObjectType = 'blob' | 'tree'
export type Hash = string

interface PathHash {
  path: string
  hash: Hash
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

export async function writeTree(entries: EntryInfo[]): Promise<Hash> {
  const data = Buffer.concat(
    entries.map(to => Buffer.concat([
      Buffer.from(`100644 ${path.basename(to.filePath)}\0`),
      to.hash
    ]))
  )
  const blob = asGitObject('tree', data)
  const hash = hashBuffer(blob)
  return hash
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
