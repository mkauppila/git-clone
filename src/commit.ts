import * as process from 'process'
import { userInfo, hostname } from 'os'

function formatTimeZoneOffset(offsetInMinutes: number): string {
  const sign = offsetInMinutes < 0 ? '-' : '+'
  const hours = Math.abs(Math.floor(offsetInMinutes / 60))
  const minutes = Math.abs(offsetInMinutes % 60)
  return sign + (hours < 10 ? '0' : '') + hours + (minutes < 10 ? '0' : '') + minutes
}

export function executeCommit() {
  // read blobs from index

  // TODO: create root tree for the blobs

  const treeHash = 'TODO'
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
  // read gecos and email from .git/config
  const gecos = 'John Doe' || realgecos
  const email = 'joh.doe@unko.wn'
  const date = realdate
  const comment = 'comment'
  const data = Buffer.concat([
    Buffer.from(`tree ${treeHash}\n`),
    // note: there's multiple parents in merge commits
    Buffer.from(`parent ${parentHash}\n`),
    Buffer.from(`author ${gecos} <${email}> ${date}\n`),
    Buffer.from(`committer ${realgecos} <${realemail}> ${realdate}\n`),
    Buffer.from(comment)
  ])
  const commit = Buffer.concat([
    Buffer.from(`commit ${data.length}\0`),
    data
  ])
  // writeObject(hashBuffer(commit), zlib.deflateSync(commit))
}
