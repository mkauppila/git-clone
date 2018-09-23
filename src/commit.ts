import * as process from 'process'
import { userInfo, hostname } from 'os'

export function executeCommit() {
  // read blobs from index

  // create root tree for the blobs

  const treeHash = 'TODO'
  const parentHash = 'TODO'
  const realgecos = userInfo().username
  const realemail = `${userInfo().username}@${hostname()}`
  // realdate should be ctime() format
  // see: https://www.tutorialspoint.com/c_standard_library/c_function_ctime.htm
  const realdate = Date.now().toLocaleString('Www Mmm dd hh:mm:ss yyyy')
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
