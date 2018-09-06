import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'
import * as zlib from 'zlib'

interface TreeObject {
  hash: string
  name: string
  permissons: string // change to number, 0o100644 (0o644)
  type: 'blob' | 'tree'
  deflatedSize: number
}

function writeBlob(filePath: string): Promise<TreeObject> {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (error, dataBuffer) => {
      if (error) {
        console.error(`Error reading file: ${filePath} - ${error}`)
      } else {
        // TODO handl directories
        // TODO could all of this be done with buffers?
        // TODO handle errors
        // TODO use the non-sync functions instead of syncs?

        const data = dataBuffer.toString()
        const header = `blob ${data.length}\0`
        const blob = header + data
        console.log(blob)

        const sha = crypto.createHash('sha1')
        sha.update(blob)
        const hexDigest = sha.digest('hex')
        console.log(hexDigest)

        // sha.digest('')

        const directoryName = hexDigest.slice(0, 2)
        const fileName = hexDigest.slice(2, hexDigest.length)

        // console.log(directoryName)
        // console.log(fileName)

        const deflatedBlob = zlib.deflateSync(Buffer.from(blob, 'utf-8'))
        // deflatedBlob.byteLength

        fs.mkdirSync(`./.git/objects/${directoryName}`)
        fs.writeFileSync(`./.git/objects/${directoryName}/${fileName}`, deflatedBlob)

        resolve({
          hash: hexDigest,
          name: path.posix.basename(filePath),
          permissons: '100644',
          type: 'blob',
          deflatedSize: deflatedBlob.byteLength
        })
      }
    })
  })
}

function writeTree(name: string, to: TreeObject) {
  console.log('----------------------')
  console.log('to', to)

  const data = Buffer.concat([
    Buffer.from('100644'.replace(/^0/, '')), // wtf?
    Buffer.from(' '),
    Buffer.from(to.name, 'utf-8'),
    Buffer.from('\0'),
    Buffer.from(to.hash, 'hex'),
    // let oid = Buffer.from(entry.oid.match(/../g).map(n => parseInt(n, 16)))
    // Buffer.from(to.hash.match(/../g)!.map(n => parseInt(n, 16)))
  ])

  const blob = Buffer.concat([
    Buffer.from(`tree ${data.byteLength.toString()}\0`),
    Buffer.from(data),
  ])


  const sha = crypto.createHash('sha1')
  sha.update(blob)
  const hexDigest = sha.digest('hex')
  console.log('hex digest', hexDigest)

  const deflatedBlob = zlib.deflateSync(blob)

  const directoryName = hexDigest.slice(0, 2)
  const fileName = hexDigest.slice(2, hexDigest.length)

  // TODO: second byte is wrong
  // this: 9c, git: 01
  // could the deflate cause this difference (nope)

  // creating this file works
  // real git can read it in another repo
  // but it just doesn't work here for some reason
  // could be issue with sub-repository structure?
  // TODO create a clean repo with this!

  fs.mkdirSync(`./.git/objects/${directoryName}`)
  fs.writeFileSync(`./.git/objects/${directoryName}/${fileName}`, deflatedBlob)
}

export async function executeAdd(filePath: string): Promise<void> {
  const segments = filePath.split(path.sep)

  const treeObject = await writeBlob(filePath)
  writeTree(segments[1], treeObject)
}
