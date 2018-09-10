import * as fsNode from 'fs'
import * as util from 'util'

export default {
  readFile: util.promisify(fsNode.readFile),
  mkdir: util.promisify(fsNode.mkdir),
  writeFile: util.promisify(fsNode.writeFile),
  exists: util.promisify(fsNode.exists),
  lstat: util.promisify(fsNode.lstat),
}
