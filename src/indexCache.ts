import fs from './fs'
import * as fsNode from 'fs'

function sanitizeMode(mode: number): number {
  // http://man7.org/linux/man-pages/man7/inode.7.html
  // See section titled: `The file type and mode`
  //
  // POSIX refers to the stat.st_mode bits corresponding to the mask
  // S_IFMT (see below) as the file type, the 12 bits corresponding to the
  // mask 07777 as the file mode bits and the least significant 9 bits
  // (0777) as the file permission bits.

  // https://github.com/git/git/blob/master/Documentation/technical/index-format.txt
  // 32-bit mode, split into (high to low bits)
  //
  // 4-bit object type
  //   valid values in binary are 1000 (regular file), 1010 (symbolic link)
  //   and 1110 (gitlink)
  //
  // 3-bit unused
  //
  // 9-bit unix permission. Only 0755 and 0644 are valid for regular files.
  // Symbolic links and gitlinks have value 0 in this field.
  //
  enum ObjectType {
    file = 0b1000,
    symlink = 0b1010,
    gitlink = 0b1110, // RESEARCH: what is gitlink?
    // VERIFY: directory is not needed? They're not handled by the index anyway?
  }
  const permissions = mode & 0o777
  const type = mode >> 12
  switch (type) {
    case ObjectType.symlink:
    case ObjectType.gitlink:
      return (type << 12) + 0
    case ObjectType.file:
    default:
      const ownerExecution = 0b1000000
      const groupExecution = 0b1000
      const othersExecution = 0b1
      const executionable = permissions & (ownerExecution & groupExecution & othersExecution)
      return (ObjectType.file << 12) + (executionable > 0 ? 0o755 : 0o644)
  }
}

interface EntryInfo {
  filePath: string
  hash: Buffer
}
let entries: EntryInfo[] = []

export function addEntryToIndexCache(
  filePath: string,
  hash: string
): void {
  entries.push({ filePath, hash: Buffer.from(hash, 'hex') })
}

export async function updateIndexCacheFile(): Promise<void> {
  const header = Buffer.alloc(12)
  let c = 0
  c = header.write('DIRC', c, 4, 'ascii')
  c = header.writeInt32BE(2, c) // index version
  c = header.writeInt32BE(entries.length, c)

  const contentBuffers = entries
    // FIXME: sort order should not use local!
    //
    // Index entries are sorted in ascending order on the name field,
    // interpreted as a string of unsigned bytes (i.e. memcmp() order, no
    // localization, no special casing of directory separator '/'). Entries
    // with the same name are sorted by their stage field.
    // (https://github.com/git/git/blob/master/Documentation/technical/index-format.txt)
    .sort((a, b) => a.filePath.localeCompare(b.filePath))
    .map(({ filePath, hash }) => {
      const stats = fsNode.lstatSync(filePath)

      const ctime = Buffer.alloc(8)
      const cTimeSeconds = Math.floor(stats.ctime.valueOf() / 1000)
      const cTimeNanoseconds = (stats.ctime.valueOf() - cTimeSeconds * 1000) * 1000000
      c = ctime.writeInt32BE(cTimeSeconds, 0)
      c = ctime.writeInt32BE(cTimeNanoseconds, c)

      const mtime = Buffer.alloc(8)
      const mTimeSeconds = Math.floor(stats.mtime.valueOf() / 1000)
      const mTimeNanoseconds = Math.floor(stats.mtime.valueOf() -  mTimeSeconds * 1000) * 1000000
      c = mtime.writeInt32BE(mTimeSeconds, 0)
      c = mtime.writeInt32BE(mTimeNanoseconds, c)

      const maxUint32 = 2 ** 32

      const info = Buffer.alloc(4 * 6)
      c = info.writeInt32BE(stats.dev, 0)
      c = info.writeInt32BE(stats.ino % maxUint32, c)
      c = info.writeInt32BE(sanitizeMode(stats.mode % maxUint32), c)
      c = info.writeInt32BE(stats.uid, c)
      c = info.writeInt32BE(stats.gid, c)
      c = info.writeInt32BE(stats.size > maxUint32 ? maxUint32 : stats.size, c)

      const flags = Buffer.alloc(2)
      const nameLenght = filePath.length > 0xFFF ? 0xFFF : filePath.length
      // TODO: needs some TLC when adding support for merges
      flags.writeInt16BE((0x0000 & (0b1 << 15)) + (nameLenght % 0o7777) , 0)

      // Entry path name (variable length) relative to top level directory
      // (without leading slash). '/' is used as path separator. The special
      // path components ".", ".." and ".git" (without quotes) are disallowed.
      // Trailing slash is also disallowed.
      //
      // The exact encoding is undefined, but the '.' and '/' characters
      // are encoded in 7-bit ASCII and the encoding cannot contain a NUL
      // byte (iow, this is a UNIX pathname).
      const fileName = Buffer.from(filePath, 'utf-8')

      const body = Buffer.concat([ctime, mtime, info, hash, flags, fileName])

      // 1-8 nul bytes as necessary to pad the entry to a multiple of eight bytes
      // while keeping the name NUL-terminated.
      const extraBytes = (Math.ceil((body.length + 1) / 8) * 8) - body.length
      return Buffer.concat([body, Buffer.alloc(extraBytes)])
    })

  const body = Buffer.concat([header, Buffer.concat(contentBuffers)])
  const indexSha = Buffer.from(hashBuffer(body), 'hex')
  const index = Buffer.concat([body, indexSha])

  await fs.writeFile(`./.git/index`, index)
}

export async function readIndexCacheFile() {
  let file
  try {
    file = await fs.readFile('./.git/index')
  } catch (error) {
    return
  }

  const hash = Buffer.from(file.buffer.slice(file.length - 20))
  const computedHash = hashBufferNoEncoding(Buffer.from(file.buffer.slice(0, file.length - 20)))
  if (!hash.equals(computedHash)) {
    // FAIL: Evil index file! Hashes don't match!
  }

  const decoder = new TextDecoder()
  const marker = decoder.decode(file.buffer.slice(0, 4))
  if (marker !== 'DIRC') {
    // FAIL: evil index file!
  }
  const version = file.readInt32BE(4)
  if (version !== 2) {
    // FAIL: Only version 2 is supported
  }
  const entryCount = file.readInt32BE(8)

  let c = 12
  let readEntries = []
  for (let entryIndex = 0; entryIndex < entryCount; entryIndex++) {
    // We only need to read the SHA and file path for an entry
    // from the index file. All the other information can be reproduced by
    // lstat when writing the entries to the index file
    c += 40
    const sha = file.buffer.slice(c, c + 20)
    const hash = Buffer.from(sha)

    c += 22
    let filePathLength = 0
    while (file.readInt8(c + filePathLength) !== 0) {
      filePathLength++
    }
    const filePath = decoder.decode(file.buffer.slice(c, c + filePathLength))
    c += filePathLength

    // Consume the nul bytes used to pad the element in
    // order to make it align by 8
    while (file.readInt8(c) === 0) {
      c++
    }

    readEntries.push({ filePath, hash })
  }
  entries = readEntries
}

// TODO: lift to utils
import * as crypto from 'crypto'
import { TextDecoder } from 'util';

function hashBufferNoEncoding(data: Buffer): Buffer {
  const sha = crypto.createHash('sha1')
  sha.update(data)
  return sha.digest()
}

function hashBuffer(data: Buffer): string {
  const sha = crypto.createHash('sha1')
  sha.update(data)
  return sha.digest('hex')
}
