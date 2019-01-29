import { userInfo, hostname } from 'os'
import {  getEntries } from './indexCache'
import { flattenPaths } from './flattenPaths'
import { Hash } from './add'

function formatTimeZoneOffset(offsetInMinutes: number): string {
  const sign = offsetInMinutes < 0 ? '-' : '+'
  const hours = Math.abs(Math.floor(offsetInMinutes / 60))
  const minutes = Math.abs(offsetInMinutes % 60)
  return sign + (hours < 10 ? '0' : '') + hours + (minutes < 10 ? '0' : '') + minutes
}

export async function treesAndBlobsFrom(paths: string[]): Promise<Hash> {
  return ''
}

export async function executeCommit(commitMessage: string) {
  const entries = await getEntries()
  const paths = flattenPaths([...entries.map(e => e.filePath), '/a/b/e/hello.md', '/mo/ma/e'])
  console.log(paths)
  const rootTreeHash = treesAndBlobsFrom(['./', ...paths])

  // TODO: create root tree for the blobs

  const treeHash = 'TODO' // await writeTree(entries)
  const parentHash = 'TODO'

  const realgecos = userInfo().username
  const realemail = `${userInfo().username}@${hostname()}`
  // "It [Date format] is `<unix timestamp> <time zone offset>`, where `<unix
  // timestamp>` is the number of seconds since the UNIX epoch.
  // `<time zone offset>` is a positive or negative offset from UTC.
  // For example CET (which is 1 hour ahead of UTC) is `+0100`."
  // [https://github.com/git/git/blob/master/Documentation/date-formats.txt]
  const now = new Date()
  const realdate = `${Math.floor(now.valueOf() / 1000)} ${formatTimeZoneOffset(now.getTimezoneOffset())}`
  const gecos = 'John Doe' || realgecos
  const email = 'joh.doe@unko.wn' || realemail
  const date = realdate
  const data = Buffer.concat([
    Buffer.from(`tree ${treeHash}\n`),
    // note: there's multiple parents in merge commits
    Buffer.from(`parent ${parentHash}\n`),
    Buffer.from(`author ${gecos} <${email}> ${date}\n`),
    Buffer.from(`committer ${realgecos} <${realemail}> ${realdate}\n`),
    Buffer.from(commitMessage)
  ])
  const commit = Buffer.concat([
    Buffer.from(`commit ${data.length}\0`),
    data
  ])
  // writeObject(hashBuffer(commit), zlib.deflateSync(commit))
}
