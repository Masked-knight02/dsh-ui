#!/usr/bin/env node
/**
 * Register every feature plugin into a dsh profile via link installs.
 *
 * Usage:
 *   node scripts/register-all.mjs            # profile = web
 *   DSH_PROFILE=work node scripts/register-all.mjs
 *
 * Requires the dsh CLI on PATH. Run scripts/build-all.mjs first so each plugin
 * has a built lib/.
 */
import { readdirSync, existsSync } from 'node:fs'
import { resolve, join, basename } from 'node:path'
import { spawnSync } from 'node:child_process'

const ROOT = resolve(import.meta.dirname, '..')
const PROFILE = process.env.DSH_PROFILE ?? 'web'

const dirs = readdirSync(join(ROOT, 'plugins'))
  .filter(name => name.startsWith('dsh-dt-') && name !== 'dsh-dt-all')
  .map(name => join(ROOT, 'plugins', name))
  .filter(dir => existsSync(join(dir, 'package.json')))
  .sort()

let failed = 0
for (const dir of dirs) {
  const name = basename(dir)
  process.stdout.write(`add ${name} ... `)
  const result = spawnSync('dsh', ['plugin', '--profile', PROFILE, 'add', `link:${dir}`], { stdio: 'ignore' })
  if (result.status === 0) {
    console.log('ok')
  } else {
    console.log(`FAILED (${result.status})`)
    failed++
  }
}

console.log(`\n${dirs.length - failed} registered, ${failed} failed (profile: ${PROFILE})`)
process.exitCode = failed > 0 ? 1 : 0
