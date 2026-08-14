/**
 * @masked-knight02/dsh-client-ui-dt-panel - host half: read-only routes over
 * the current working directory - the file tree (/api/dsh-dt-panel/files),
 * the git change list (/api/dsh-dt-panel/changes) and single-file content
 * (/api/dsh-dt-panel/file). Every route is gated (requested path must stay
 * inside cwd, depth/count caps, node_modules/.git ignored, no writes); the
 * browser half renders the sidebar entry and the three-tab panel from these
 * routes.
 *
 * @module @masked-knight02/dsh-client-ui-dt-panel
 */

import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { isAbsolute, relative, resolve, sep } from 'node:path'
import type { Dirent, Stats } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-host-webserver'

/** Required services: the route registry. */
export const inject = ['webServer']

/** Maximum recursion depth of one file-tree walk (client-requested depth is clamped to this). */
export const MAX_DEPTH = 4

/** Maximum entries one file-tree walk may return before it truncates. */
export const MAX_ENTRIES = 500

/** Maximum size of a single file served by the preview route (256 KiB). */
export const FILE_CAP_BYTES = 256 * 1024

/** Collected-output cap for one git status command. */
export const CHANGES_CAP_BYTES = 1 << 20

/** Entry names never surfaced by the file-tree walk. */
const IGNORED_NAMES = new Set(['node_modules', '.git'])

/** One row of the file tree: name, directory flag, cwd-relative path. */
export interface FileEntry {
  name: string
  dir: boolean
  path: string
}

/** The JSON envelope of the file-tree route. */
export interface FilesPayload {
  ok: boolean
  root: string
  depth: number
  entries: FileEntry[]
  truncated: boolean
}

/** One parsed git status --porcelain row. */
export interface ChangeEntry {
  index: string
  worktree: string
  path: string
  kind: string
}

/** The JSON envelope of the git changes route. */
export interface ChangesPayload {
  ok: boolean
  changes: ChangeEntry[]
  error?: string
}

/** The JSON envelope of the single-file content route. */
export interface FilePayload {
  ok: boolean
  path: string
  size: number
  binary: boolean
  tooLarge: boolean
  text: string
}

/** Mutable state of one file-tree walk. */
interface WalkState {
  entries: FileEntry[]
  truncated: boolean
}

/** Write a JSON response with the given status code. */
function sendJson(res: ServerResponse, status: number, payload: unknown): void {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(payload))
}

/**
 * Resolve a client-supplied relative path against cwd, rejecting anything
 * that escapes the working directory (absolute paths, `..` traversal, null
 * bytes). Returns the absolute target plus its posix-style relative form.
 * @param raw - the raw `path` query value, or null/'' for cwd itself.
 */
function resolveRequestedPath(raw: string | null): { ok: true; abs: string; rel: string } | { ok: false; error: string } {
  const root = process.cwd()
  if (raw === null || raw === '') return { ok: true, abs: root, rel: '' }
  if (raw.includes('\0') || isAbsolute(raw)) return { ok: false, error: 'invalid path' }
  const abs = resolve(root, raw)
  if (abs !== root && !abs.startsWith(root + sep)) {
    return { ok: false, error: 'path escapes the working directory' }
  }
  return { ok: true, abs, rel: relative(root, abs).split(sep).join('/') }
}

/**
 * Parse the optional `depth` query value into a walk depth: default 1
 * (direct children only), clamped to the [1, MAX_DEPTH] range.
 * @param raw - the raw `depth` query value.
 */
function parseDepth(raw: string | null): number {
  if (raw === null || raw === '') return 1
  const value = Number.parseInt(raw, 10)
  if (!Number.isFinite(value)) return 1
  return Math.min(Math.max(value, 1), MAX_DEPTH)
}

/**
 * Walk one directory and append its rows to the walk state. Directories come
 * first (alphabetical), then files; node_modules/.git are skipped at every
 * level; symlinked directories are reported as files and never recursed (no
 * cycle or escape risk); unreadable directories are skipped silently. Stops
 * appending once MAX_ENTRIES is reached (truncated flag).
 * @param absDir - absolute directory to list.
 * @param relDir - cwd-relative (posix) form of absDir.
 * @param depth - remaining recursion depth (1 = this directory only).
 * @param state - shared walk state.
 */
function walkDir(absDir: string, relDir: string, depth: number, state: WalkState): void {
  if (state.truncated || depth <= 0) return
  let dirents: Dirent[]
  try {
    dirents = readdirSync(absDir, { withFileTypes: true })
  } catch {
    return
  }
  dirents.sort((a, b) => {
    const aDir = a.isDirectory() ? 0 : 1
    const bDir = b.isDirectory() ? 0 : 1
    return aDir - bDir || a.name.localeCompare(b.name, undefined, { numeric: true })
  })
  for (const dirent of dirents) {
    if (IGNORED_NAMES.has(dirent.name)) continue
    if (state.truncated) return
    const relPath = relDir === '' ? dirent.name : `${relDir}/${dirent.name}`
    const isDir = dirent.isDirectory()
    state.entries.push({ name: dirent.name, dir: isDir, path: relPath })
    if (state.entries.length >= MAX_ENTRIES) {
      state.truncated = true
      return
    }
    if (isDir && depth > 1) walkDir(resolve(absDir, dirent.name), relPath, depth - 1, state)
  }
}

/** Handle one file-tree request. */
function handleFiles(req: IncomingMessage, res: ServerResponse): void {
  const url = new URL(req.url ?? '/', 'http://x')
  const resolved = resolveRequestedPath(url.searchParams.get('path'))
  if (!resolved.ok) {
    sendJson(res, 400, { ok: false, error: resolved.error })
    return
  }
  const depth = parseDepth(url.searchParams.get('depth'))
  const state: WalkState = { entries: [], truncated: false }
  walkDir(resolved.abs, resolved.rel, depth, state)
  const payload: FilesPayload = {
    ok: true,
    root: resolved.rel,
    depth,
    entries: state.entries,
    truncated: state.truncated,
  }
  sendJson(res, 200, payload)
}

/**
 * Map the two porcelain status chars to a display kind: the non-space side
 * wins (index first), untracked/ignored are the `??`/`!!` pairs.
 * @param index - the index column char.
 * @param worktree - the worktree column char.
 */
function changeKind(index: string, worktree: string): string {
  if (index === '?' && worktree === '?') return 'untracked'
  if (index === '!' && worktree === '!') return 'ignored'
  const code = index !== ' ' ? index : worktree
  const kinds: Record<string, string> = {
    A: 'added',
    M: 'modified',
    D: 'deleted',
    R: 'renamed',
    C: 'copied',
    T: 'typechange',
    U: 'unmerged',
  }
  return kinds[code] ?? 'changed'
}

/**
 * Unquote a porcelain path column when core.quotepath wrapped segments in
 * `"..."` with C-style escapes (non-ASCII bytes become \NNN octal). Quote
 * tracking is scanner-based so rename/copy rows (`old -> new`, each side
 * quoted independently) and paths containing ` -> ` or spaces survive.
 * @param raw - the path column of one porcelain row.
 */
function porcelainPath(raw: string): string {
  let out = ''
  let bytes: number[] | null = null
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i]
    if (bytes !== null) {
      if (ch === '"') {
        out += Buffer.from(bytes).toString('utf8')
        bytes = null
        continue
      }
      if (ch !== '\\') {
        bytes.push(raw.charCodeAt(i))
        continue
      }
      const next = raw[i + 1]
      if (next === undefined) break
      if (next === '\\' || next === '"') {
        bytes.push(next.charCodeAt(0))
        i++
        continue
      }
      if (next === 't') {
        bytes.push(0x09)
        i++
        continue
      }
      if (next === 'n') {
        bytes.push(0x0a)
        i++
        continue
      }
      const octal = raw.slice(i + 1, i + 4)
      if (/^[0-7]{3}$/.test(octal)) {
        bytes.push(Number.parseInt(octal, 8))
        i += 3
        continue
      }
      bytes.push(ch.charCodeAt(0))
      continue
    }
    if (ch === '"') {
      bytes = []
      continue
    }
    out += ch
  }
  if (bytes !== null) out += Buffer.from(bytes).toString('utf8')
  return out
}

/** Parse `git status --porcelain` output into change rows. */
function parsePorcelain(out: string): ChangeEntry[] {
  const changes: ChangeEntry[] = []
  for (const line of out.split('\n')) {
    if (line === '') continue
    const index = line[0] ?? ' '
    const worktree = line[1] ?? ' '
    const rest = line.slice(3)
    if (rest === '') continue
    changes.push({ index, worktree, path: porcelainPath(rest), kind: changeKind(index, worktree) })
  }
  return changes
}

/** Handle one git changes request; an empty list on any git failure. */
function handleChanges(_req: IncomingMessage, res: ServerResponse): void {
  let out: string
  try {
    out = execFileSync('git', ['status', '--porcelain'], {
      cwd: process.cwd(),
      encoding: 'utf8',
      maxBuffer: CHANGES_CAP_BYTES,
    })
  } catch (error) {
    const payload: ChangesPayload = {
      ok: false,
      changes: [],
      error: error instanceof Error ? error.message : 'git status failed',
    }
    sendJson(res, 200, payload)
    return
  }
  const payload: ChangesPayload = { ok: true, changes: parsePorcelain(out) }
  sendJson(res, 200, payload)
}

/** Handle one single-file content request (read-only, size-capped). */
function handleFile(req: IncomingMessage, res: ServerResponse): void {
  const url = new URL(req.url ?? '/', 'http://x')
  const resolved = resolveRequestedPath(url.searchParams.get('path'))
  if (!resolved.ok) {
    sendJson(res, 400, { ok: false, error: resolved.error })
    return
  }
  let stat: Stats
  try {
    stat = statSync(resolved.abs)
  } catch {
    sendJson(res, 404, { ok: false, error: 'file not found' })
    return
  }
  if (!stat.isFile()) {
    sendJson(res, 400, { ok: false, error: 'not a regular file' })
    return
  }
  if (stat.size > FILE_CAP_BYTES) {
    const payload: FilePayload = {
      ok: true,
      path: resolved.rel,
      size: stat.size,
      binary: false,
      tooLarge: true,
      text: '',
    }
    sendJson(res, 200, payload)
    return
  }
  let buf: Buffer
  try {
    buf = readFileSync(resolved.abs)
  } catch {
    sendJson(res, 404, { ok: false, error: 'file unreadable' })
    return
  }
  const binary = buf.includes(0)
  const payload: FilePayload = {
    ok: true,
    path: resolved.rel,
    size: buf.length,
    binary,
    tooLarge: false,
    text: binary ? '' : buf.toString('utf8'),
  }
  sendJson(res, 200, payload)
}

/**
 * Mount the file-tree, git changes, and single-file content routes.
 * @param ctx - context carrying webServer.
 */
export function apply(ctx: Context): void {
  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: '/api/dsh-dt-panel/files',
    handler: handleFiles,
  }), 'dsh-dt-panel: /api/dsh-dt-panel/files route')
  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: '/api/dsh-dt-panel/changes',
    handler: handleChanges,
  }), 'dsh-dt-panel: /api/dsh-dt-panel/changes route')
  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: '/api/dsh-dt-panel/file',
    handler: handleFile,
  }), 'dsh-dt-panel: /api/dsh-dt-panel/file route')
}
