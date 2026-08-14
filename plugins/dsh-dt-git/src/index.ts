/**
 * @masked-knight02/dsh-client-ui-dt-git - host half: a real git service over
 * the managed subprocess seam, gated to registered workspaces. It serves the
 * current branch, the local branch list, and the commit graph for the
 * workspace the browser asks for. The browser half renders the sidebar entry
 * and the graph panel from these routes.
 *
 * @module @masked-knight02/dsh-client-ui-dt-git
 */

import { realpath } from 'node:fs/promises'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-host-webserver'
import type {} from '@deepseek-ai/dsh-subprocess'
import type { SubprocessSpawnSpec } from '@deepseek-ai/dsh-subprocess'
import type {} from '@deepseek-ai/dsh-workspace'

/** Required services: the route registry, the managed subprocess seam, and the workspace registry. */
export const inject = ['webServer', 'subprocess', 'workspaceRegistry']

/** One graph commit row. */
export interface GitCommitRow {
  oid: string
  subject: string
  author: string
  time: string
  ref: string
}

/** The git overview payload. */
export interface GitOverviewPayload {
  ok: boolean
  workspace: string
  branch: string
  branches: string[]
  commits: GitCommitRow[]
}

/** Collected-output cap for one git command. */
const OUTPUT_CAP_BYTES = 1 << 20

/** The workspace-membership verdict type. */
type WorkspaceVerdict = { ok: true; canonical: string } | { ok: false; error: string }

/**
 * Workspace-membership gate: canonicalize the requested path and require it
 * to equal a registered workspace path. The browser may only run git on
 * workspace roots, never arbitrary host directories.
 * @param ctx - context carrying the workspace registry.
 * @param path - the requested path.
 */
async function gateWorkspace(ctx: Context, path: string): Promise<WorkspaceVerdict> {
  let canonical: string
  try {
    canonical = await realpath(path)
  } catch {
    return { ok: false, error: 'path does not resolve on disk' }
  }
  if (ctx.workspaceRegistry.list().some(workspace => workspace.path === canonical)) {
    return { ok: true, canonical }
  }
  return { ok: false, error: 'path is not a registered workspace' }
}

/** Run one git command through the managed subprocess seam. */
async function runGit(ctx: Context, argv: readonly string[], cwd: string): Promise<string> {
  const spec: SubprocessSpawnSpec = {
    argv: ['git', ...argv],
    cwd,
    stdio: {
      stdin: 'ignore',
      stdout: { maxBytes: OUTPUT_CAP_BYTES },
      stderr: { maxBytes: OUTPUT_CAP_BYTES },
    },
    graceMs: 10_000,
  }
  const handle = ctx.subprocess.spawn(spec)
  const outcome = await handle.done
  if (outcome.exitCode !== 0) return ''
  return handle.collected.stdout?.readFrom(0).text ?? ''
}

/** Resolve the git top-level of a workspace root, or null when not a repository. */
async function repoRoot(ctx: Context, cwd: string): Promise<string | null> {
  const out = await runGit(ctx, ['rev-parse', '--show-toplevel'], cwd)
  const root = out.trim()
  return root === '' ? null : root
}

/** Handle one overview request for a workspace path. */
async function handleOverview(ctx: Context, req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url ?? '/', 'http://x')
  const path = url.searchParams.get('path')
  if (path === null || path === '') {
    res.writeHead(400, { 'content-type': 'application/json; charset=utf-8' })
    res.end(JSON.stringify({ ok: false, error: 'missing workspace path' }))
    return
  }
  const gated = await gateWorkspace(ctx, path)
  if (!gated.ok) {
    res.writeHead(403, { 'content-type': 'application/json; charset=utf-8' })
    res.end(JSON.stringify({ ok: false, error: gated.error }))
    return
  }
  const root = await repoRoot(ctx, gated.canonical)
  if (root === null) {
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' })
    res.end(JSON.stringify({ ok: true, workspace: gated.canonical, branch: '', branches: [], commits: [] }))
    return
  }

  const [branchText, refsText, logText] = await Promise.all([
    runGit(ctx, ['branch', '--show-current'], root),
    runGit(ctx, ['for-each-ref', '--format=%(refname:short)', 'refs/heads/'], root),
    runGit(ctx, ['log', '-15', '--pretty=format:%h|%s|%an|%ar|%D'], root),
  ])

  const branch = branchText.trim()
  const branches = refsText.split(/\r?\n/).filter(line => line.trim() !== '')
  const commits: GitCommitRow[] = logText.split(/\r?\n/).filter(line => line.trim() !== '').map(line => {
    const [oid, subject, author, time, refs = ''] = line.split('|')
    const ref = refs.match(/(?:HEAD -> |origin\/)?([^,]+)/)?.[1] ?? branch
    return { oid, subject, author, time, ref }
  })

  const payload: GitOverviewPayload = {
    ok: true,
    workspace: gated.canonical,
    branch: branch === 'HEAD' ? '' : branch,
    branches: branches.length > 0 ? branches : (branch === '' ? [] : [branch]),
    commits,
  }
  res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(payload))
}

/**
 * Mount the git overview route.
 * @param ctx - context carrying webServer, subprocess, and workspaceRegistry.
 */
export function apply(ctx: Context): void {
  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: '/api/dsh-dt-git/overview',
    handler: (req, res) => { void handleOverview(ctx, req, res) },
  }), 'dsh-dt-git: /api/dsh-dt-git/overview route')
}
