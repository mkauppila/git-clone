import * as fsNode from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'
import * as zlib from 'zlib'
import * as util from 'util'

const fs = {
  readFile: util.promisify(fsNode.readFile),
  mkdir: util.promisify(fsNode.mkdir),
  writeFile: util.promisify(fsNode.writeFile),
}

interface TreeObject {
  hash: string
  name: string
  permissons: string
  type: 'blob' | 'tree'
  deflatedSize: number
}

async function writeBlob(filePath: string): Promise<TreeObject> {
  const dataBuffer = await fs.readFile(filePath) // TODO add error handling
  const data = dataBuffer.toString()
  const header = `blob ${data.length}\0`
  const blob = header + data

  const sha = crypto.createHash('sha1')
  sha.update(blob)
  const hexDigest = sha.digest('hex')

  const directoryName = hexDigest.slice(0, 2)
  const fileName = hexDigest.slice(2, hexDigest.length)

  const deflatedBlob = zlib.deflateSync(Buffer.from(blob, 'utf-8'))
  const defaultPermissions = '100644'

  await fs.mkdir(`./.git/objects/${directoryName}`)
  await fs.writeFile(`./.git/objects/${directoryName}/${fileName}`, deflatedBlob)

  return {
    hash: hexDigest,
    name: path.posix.basename(filePath),
    permissons: defaultPermissions,
    type: 'blob',
    deflatedSize: deflatedBlob.byteLength
  }
}

async function writeTree(name: string, to: TreeObject) {
  const data = Buffer.concat([
    Buffer.from(to.permissons), // VERIFY: the format, why string?
    Buffer.from(' '),
    Buffer.from(to.name, 'utf-8'),
    Buffer.from('\0'),
    Buffer.from(to.hash, 'hex'),
  ])

  const blob = Buffer.concat([
    Buffer.from(`tree ${data.byteLength.toString()}\0`),
    Buffer.from(data),
  ])

  const sha = crypto.createHash('sha1')
  sha.update(blob)
  const hexDigest = sha.digest('hex')

  const deflatedBlob = zlib.deflateSync(blob)

  const directoryName = hexDigest.slice(0, 2)
  const fileName = hexDigest.slice(2, hexDigest.length)

  await fs.mkdir(`./.git/objects/${directoryName}`)
  await fs.writeFile(`./.git/objects/${directoryName}/${fileName}`, deflatedBlob)
}

export async function executeAdd(filePath: string): Promise<void> {
  const segments = filePath.split(path.sep)
  const treeObject = await writeBlob(filePath)
  writeTree(segments[1], treeObject)
}
