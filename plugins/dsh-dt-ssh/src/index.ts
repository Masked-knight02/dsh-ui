/**
 * @masked-knight02/dsh-client-ui-dt-ssh - host half: a real SSH operations
 * service. Host config persists to ~/.dsh/dsh-dt-ssh.json (0600); the
 * engine runs real ssh2 connections for connect tests and command exec.
 * The browser half renders the sidebar entry and the hosts/exec panel.
 *
 * @module @masked-knight02/dsh-client-ui-dt-ssh
 */

import { mkdirSync, readFileSync, writeFileSync, existsSync, chmodSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { Client } from 'ssh2'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-host-webserver'

/** Required services: the route registry. */
export const inject = ['webServer']

/** One SSH host config row. */
export interface SshHost {
  alias: string
  host: string
  port: number
  user: string
  auth: 'key' | 'password'
  password?: string
  description?: string
}

/** The config store file path. */
const STORE_PATH = join(homedir(), '.dsh', 'dsh-dt-ssh.json')

/** Read the persisted host list. */
function readStore(): SshHost[] {
  try {
    if (!existsSync(STORE_PATH)) return []
    const raw = readFileSync(STORE_PATH, 'utf8')
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? parsed as SshHost[] : []
  } catch {
    return []
  }
}

/** Write the host list with 0600 permissions. */
function writeStore(hosts: SshHost[]): void {
  const dir = join(homedir(), '.dsh')
  mkdirSync(dir, { recursive: true, mode: 0o700 })
  writeFileSync(STORE_PATH, JSON.stringify(hosts, null, 2), { mode: 0o600 })
  chmodSync(STORE_PATH, 0o600)
}

/** Read a JSON request body. */
async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(chunk as Buffer)
    if (chunks.reduce((sum, part) => sum + part.length, 0) > (1 << 20)) return null
  }
  const text = Buffer.concat(chunks).toString('utf8')
  if (text === '') return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    return null
  }
}

/** Write a JSON response. */
function json(res: ServerResponse, status: number, payload: unknown): void {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(payload))
}

/** Open an ssh2 connection for one host. */
function connect(host: SshHost): Promise<Client> {
  return new Promise((resolve, reject) => {
    const client = new Client()
    client.on('ready', () => resolve(client))
    client.on('error', (error: Error) => reject(error))
    client.connect({
      host: host.host,
      port: host.port,
      username: host.user,
      password: host.auth === 'password' ? host.password : undefined,
      tryKeyboard: false,
      readyTimeout: 8_000,
    })
  })
}

/** Run one command over an open connection. */
function exec(client: Client, command: string, timeoutMs: number): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      client.end()
      reject(new Error('command timed out'))
    }, timeoutMs)
    client.exec(command, (error, stream) => {
      if (error !== null && error !== undefined) {
        clearTimeout(timer)
        reject(error)
        return
      }
      let stdout = ''
      let stderr = ''
      stream.on('data', (chunk: Buffer) => { stdout += chunk.toString('utf8') })
      stream.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString('utf8') })
      stream.on('close', (code: number | null) => {
        clearTimeout(timer)
        client.end()
        resolve({ code: code ?? -1, stdout, stderr })
      })
    })
  })
}

/** Handle the hosts list route. */
function handleHosts(_req: IncomingMessage, res: ServerResponse): void {
  json(res, 200, { ok: true, hosts: readStore() })
}

/** Handle the host save route. */
async function handleSave(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const payload = await readJsonBody(req)
  if (typeof payload !== 'object' || payload === null) {
    json(res, 400, { ok: false, error: 'malformed request' })
    return
  }
  const host = payload as Partial<SshHost>
  if (typeof host.alias !== 'string' || host.alias === '' || typeof host.host !== 'string' || host.host === '') {
    json(res, 400, { ok: false, error: 'alias and host are required' })
    return
  }
  const hosts = readStore()
  const index = hosts.findIndex(row => row.alias === host.alias)
  const row: SshHost = {
    alias: host.alias,
    host: host.host,
    port: typeof host.port === 'number' && host.port > 0 ? host.port : 22,
    user: host.user ?? 'root',
    auth: host.auth === 'password' ? 'password' : 'key',
    password: host.password,
    description: host.description,
  }
  if (index >= 0) hosts[index] = row
  else hosts.push(row)
  writeStore(hosts)
  json(res, 200, { ok: true, hosts })
}

/** Handle the host delete route. */
async function handleDelete(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const payload = await readJsonBody(req)
  if (typeof payload !== 'object' || payload === null || typeof (payload as Record<string, unknown>).alias !== 'string') {
    json(res, 400, { ok: false, error: 'malformed request' })
    return
  }
  const alias = (payload as { alias: string }).alias
  const hosts = readStore().filter(row => row.alias !== alias)
  writeStore(hosts)
  json(res, 200, { ok: true, hosts })
}

/** Handle the connect-test route (real ssh2 handshake). */
async function handleTest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const payload = await readJsonBody(req)
  if (typeof payload !== 'object' || payload === null) {
    json(res, 400, { ok: false, error: 'malformed request' })
    return
  }
  const host = payload as SshHost
  try {
    const started = Date.now()
    const client = await connect(host)
    const latencyMs = Date.now() - started
    client.end()
    json(res, 200, { ok: true, latencyMs })
  } catch (error) {
    json(res, 200, { ok: false, error: error instanceof Error ? error.message : String(error) })
  }
}

/** Handle the exec route (real remote command). */
async function handleExec(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const payload = await readJsonBody(req)
  if (typeof payload !== 'object' || payload === null) {
    json(res, 400, { ok: false, error: 'malformed request' })
    return
  }
  const { host, command } = payload as { host?: SshHost; command?: string }
  if (host === undefined || typeof command !== 'string' || command === '') {
    json(res, 400, { ok: false, error: 'host and command are required' })
    return
  }
  try {
    const client = await connect(host)
    const result = await exec(client, command, 30_000)
    json(res, 200, { ok: true, code: result.code, stdout: result.stdout, stderr: result.stderr })
  } catch (error) {
    json(res, 200, { ok: false, error: error instanceof Error ? error.message : String(error) })
  }
}

/**
 * Mount the SSH routes.
 * @param ctx - context carrying webServer.
 */
export function apply(ctx: Context): void {
  const register = (path: string, handler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void>): void => {
    ctx.effect(() => ctx.webServer.register({
      kind: 'exact',
      path,
      handler,
    }), `dsh-dt-ssh: ${path} route`)
  }
  register('/api/dsh-dt-ssh/hosts', handleHosts)
  register('/api/dsh-dt-ssh/save', (req, res) => { void handleSave(req, res) })
  register('/api/dsh-dt-ssh/delete', (req, res) => { void handleDelete(req, res) })
  register('/api/dsh-dt-ssh/test', (req, res) => { void handleTest(req, res) })
  register('/api/dsh-dt-ssh/exec', (req, res) => { void handleExec(req, res) })
}
