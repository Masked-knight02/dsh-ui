#!/usr/bin/env node
/**
 * Build every plugin and skin in one shot: runs `corepack pnpm install` then
 * `corepack pnpm run build` (= tsc -b && tsdown) in each package directory.
 *
 * Usage:
 *   node scripts/build-all.mjs
 *
 * Skips directories without a package.json. dsh-dt-all fails until its
 * @masked-knight02 sub-packages are published to npm, so it is reported
 * separately and does not fail the run.
 */
import { readdirSync, existsSync } from 'node:fs'
import { resolve, join, basename } from 'node:path'
import { spawnSync } from 'node:child_process'

const ROOT = resolve(import.meta.dirname, '..')

/** Collect plugin and skin package directories (those carrying a package.json). */
function packages() {
  const groups = ['plugins', 'skins']
  const dirs = []
  for (const group of groups) {
    const base = join(ROOT, group)
    if (!existsSync(base)) continue
    for (const entry of readdirSync(base)) {
      const dir = join(base, entry)
      if (existsSync(join(dir, 'package.json'))) dirs.push(dir)
    }
  }
  return dirs
}

/** Run a command in a directory, returning true on success. */
function run(args, cwd) {
  return spawnSync('corepack', args, { cwd, stdio: 'ignore' }).status === 0
}

const dirs = packages().sort()
const passed = []
const failed = []
const skipped = []

for (const dir of dirs) {
  const name = basename(dir)
  if (name === 'dsh-dt-all') {
    skipped.push(name)
    continue
  }
  if (!run(['pnpm', 'install', '--prefer-offline'], dir)) {
    failed.push([name, 'install'])
    continue
  }
  if (!run(['pnpm', 'run', 'build'], dir)) {
    failed.push([name, 'build'])
    continue
  }
  passed.push(name)
}

for (const name of passed) console.log(`PASS  ${name}`)
for (const [name, stage] of failed) console.error(`FAIL  ${name} (${stage})`)
for (const name of skipped) console.log(`SKIP  ${name} (sub-packages not published yet)`)

console.log(`\n${passed.length} passed, ${failed.length} failed, ${skipped.length} skipped`)
process.exitCode = failed.length > 0 ? 1 : 0
