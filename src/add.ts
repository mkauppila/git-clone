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

function writeTree(name: string, to: TreeObject): Promise<undefined> {
  // if there's existing tree, read it, update the data and write a new tree
  console.log('treeobject: ', to)


  // why binary sha1 and not a text one => more space effiecient
  // https://docs.gitlab.com/ee/development/sha1_as_binary.html

  // buffers in node https://medium.freecodecamp.org/do-you-want-a-better-understanding-of-buffer-in-node-js-check-this-out-2e29de2968e8
  // https://stackoverflow.com/questions/14790681/what-is-the-internal-format-of-a-git-tree-object
  // https://stackoverflow.com/questions/14430633/how-to-convert-text-to-binary-code-in-javascript/14430733

  // let's try this with file stream it's not about text
  // http://codewinds.com/blog/2013-08-19-nodejs-writable-streams.html#writing_text_file


  // latin1 is binary
  // https://github.com/nodejs/node/issues/12908#issuecomment-299989926

  // const data = `${to.permissons} ${to.type} ${to.hash}\t${to.name}`
  console.log(`      hash ${to.hash}`)
  const binaryHash = Buffer.from(to.hash)
  const binaryString = binaryHash.map((value) => { /*console.log(value);*/ return value }).join('')
  console.log(`binaryhash '${binaryHash}'`)
  const data = `${to.permissons} ${to.name}\0${binaryString}`
  const header = `tree ${data.length}\0`
  const blob = header + data
  console.log(`tree blob '${blob}'`)

  // 100644 blob a906cb2a4a904a152e80877d4088654daad0c859      README
  const sha = crypto.createHash('sha1')
  sha.update(blob)
  const hexDigest = sha.digest('hex')
  console.log(hexDigest)

  const directoryName = hexDigest.slice(0, 2)
  const fileName = hexDigest.slice(2, hexDigest.length)

  console.log(directoryName)
  console.log(fileName)

  const deflatedBlob = zlib.deflateSync(Buffer.from(blob, 'utf-8'))

  fs.mkdirSync(`./.git/objects/${directoryName}`)
  fs.writeFileSync(`./.git/objects/${directoryName}/${fileName}`, deflatedBlob)

  // const uint8Array = Uint8Array.from(), (v
  let byteArray = new Uint8Array(to.hash.length)
  for (var i = 0; i < to.hash.length; i++) {
    byteArray[i] = to.hash.codePointAt(i) as number
  }

  const sha1 = crypto.createHash('sha1')
  sha1.update('887ae9333d92a1d72400c210546e28baa1050e44')
  const hexDigest1 = sha1.digest('latin1')
  console.log(hexDigest1)

  // const bb = Buffer.alloc(20)
  // const codePoints = to.hash.split('').map(ch => ch.codePointAt(0) as number)
  // console.log(`code points: ${codePoints.length} ${codePoints}`)
  // codePoints[0].
  // bb.writeUInt8(codePoints[0] & codePoints[1], 0)
  // bb.writeUInt8(codePoints[2] & codePoints[3], 1)
  // bb.writeUInt8(codePoints[4] & codePoints[5], 2)
  // bb.writeUInt8(codePoints[6] & codePoints[7], 3)

  // let offset = 0
  // for (const ch of to.hash) {
  //   bb.writeUInt8(ch.codePointAt(0) as number, offset)
  //   offset += 1
  // }

  const bb = Buffer.from('887ae9333d92a1d72400c210546e28baa1050e44', 'hex')
  console.log('bb', bb)
  console.log('bb.tostring', bb.toString('latin1'))
  // bb.buffer

  // this shit! This shit works!!
  const fd = fs.openSync('./hashTest', 'w')
  fs.writeSync(fd, bb, undefined, 'binary')
  fs.close(fd, (err) => { if (err) console.log('err 1', err)})

  // const a = Buffer.alloc(20)
  // a.writeInt8()


  // const fileStream = fs.createWriteStream('./hashTest')
  // // binaryHash.forEach(value => fileStream.write(binaryHash.writeUInt8()))
  // fileStream.write(binaryHash, 'binary')
  // fileStream.close()


  // resolve({
  //   hash: hexDigest,
  //   name: path.posix.basename(filePath),
  //   permissons: '000644',
  //   type: 'blob',
  // })


  // tree object to data
  // do header
  // combine
  // write to disk

  return Promise.resolve(undefined)
}

export async function executeAdd(filePath: string): Promise<void> {
  const segments = filePath.split(path.sep)

  const treeObject = await writeBlob(filePath)
  await writeTree(segments[1], treeObject)


  // segments.reduceRight<TreeObject>(async (treeObject: TreeObject, segment: string, index: number) => {
  //   if (index === 0) {
  //     return await writeBlob(filePath)
  //   } else {
  //     return await writeTree('',  treeObject)
  //   }
  // }, undefined)
}

// example contens for a tree
// 100644 blob 5171c54083337f0b87926da2e8f52abefe19d70f	.dockerignore
// 040000 tree c74cd35d97f2abae11cd6ee88c92ea283703cf7c	src
