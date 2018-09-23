export function executeCommit() {
  // read blobs from index

  // create root tree for the blobs

  const treeHash = 'TODO'
  const parentHash = 'TODO'
  const gecos = '', email = '', date = '' // read these from envs
  const realgecos = '', realemail = '', realdate = ''
  const comment = 'comment'
  const data = Buffer.concat([
    Buffer.from(`tree ${treeHash}\n`),
    Buffer.from(`parent ${parentHash}\n`), // there could be multiple of these, ie. merge commits
    Buffer.from(`author ${gecos} <${email}> ${date}\n`),
    Buffer.from(`author ${realgecos} <${realemail}> ${realdate}\n`),
    Buffer.from(comment)
  ])
  const commit = Buffer.concat([
    Buffer.from(`commit ${data.length}\0`),
    data
  ])
  // writeObject(hashBuffer(commit), zlib.deflateSync(commit))
}
