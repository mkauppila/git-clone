import { sep as pathSegmentSeparator } from 'path'

export function flattenPaths(paths: string[]): string[] {
  const allPaths = paths
    .map(path => path.split(pathSegmentSeparator))
    .reduce((prev, cur) => prev.concat(cur), [])
  return Array.from(new Set(allPaths))
}
