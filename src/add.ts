import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'
import * as zlib from 'zlib'
import { print } from 'util';

interface TreeObject {
  hash: string
  name: string
  permissons: string
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

        console.log(directoryName)
        console.log(fileName)

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
  // proof of concept
  // const bb = Buffer.from('887ae9333d92a1d72400c210546e28baa1050e44', 'hex')
  // const fd = fs.openSync('./hashTest', 'w')
  // const a = `100644 folder\0${bb.toString('binary')}`
  // console.log(a)
  // fs.writeSync(fd, a.slice(0, a.length - 1), undefined, 'binary')
  // fs.close(fd, (err) => { if (err) console.log('err 1', err)})

  const hashBuffer = Buffer.from(to.hash, 'hex')
  const data = `${to.permissons} ${to.name}\0${hashBuffer.toString('binary')}`
  const header = `tree ${data.length}\0`
  const blob = header + data

  const sha = crypto.createHash('sha1')
  sha.update(blob)
  const hexDigest = sha.digest('hex')
  console.log(hexDigest)

  const directoryName = hexDigest.slice(0, 2)
  const fileName = hexDigest.slice(2, to.hash.length)

  const deflatedBlob = zlib.deflateSync(Buffer.from(blob, 'binary'))

  // TODO compression is wrong (or doesn't work)
  // TODO hash is wrong too

  try {
    fs.mkdirSync(`./.git/objects/${directoryName}`)
  } catch (e) {
  }
  // fs.writeFileSync(`./.git/objects/${directoryName}/${fileName}`, deflatedBlob, { encoding: 'ascii' })

  // file written like this looks more right than file written with fs.writeFileSync
  // maybe the latter defaults to text files or something
  const fd = fs.openSync(`./.git/objects/${directoryName}/${fileName}`, 'w')
  fs.writeSync(fd, deflatedBlob, undefined, 'binary')
  fs.close(fd, (err) => { if (err) console.log('err 1', err)})

  console.log(`tree '${blob}'`)
  console.log(directoryName)
  console.log(fileName)
}

export async function executeAdd(filePath: string): Promise<void> {
  const segments = filePath.split(path.sep)

  const treeObject = await writeBlob(filePath)
  writeTree(segments[1], treeObject)
}
