import * as fs from 'fs'
import * as crypto from 'crypto'
import * as zlib from 'zlib'

export function executeAdd(filePath: string): void {
  fs.readFile(filePath, (error, dataBuffer) => {
    if (error) {
      console.error(`Error reading file: ${filePath} - ${error}`)
    } else {
      // TODO handle errors
      // TODO handle directories
      // TODO could all of this be done with buffers?
      // TODO use the non-sync functions instead of syncs?

      const data = dataBuffer.toString()
      const header = `blob ${data.length}\0`
      const blob = header + data
      console.log(blob)

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
    }
  })
}
