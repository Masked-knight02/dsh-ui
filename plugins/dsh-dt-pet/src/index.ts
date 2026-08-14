/**
 * @masked-knight02/dsh-client-ui-dt-pet - host half: a live pet status route
 * that reads the shared pet state file (written by the desktop pet process)
 * and reports the current mode/message/updated stamp. The browser half
 * renders the sidebar entry and the status panel from this route.
 *
 * @module @masked-knight02/dsh-client-ui-dt-pet
 */

import { existsSync, readFileSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { resolve } from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-host-webserver'

/** Required services: the route registry. */
export const inject = ['webServer']

/** The shared pet state protocol. */
export interface PetState {
  mode: 'idle' | 'thinking' | 'working' | 'success' | 'error' | 'waiting'
  message: string
  updated: number
}

/** The JSON envelope of the pet status route. */
export interface PetStatusPayload extends PetState {
  ok: boolean
  source: string | null
}

/** Candidate status files, newest mtime wins. */
function candidateFiles(): string[] {
  const stateDir = process.env.DSH_STATE_DIR
  return [
    stateDir !== undefined && stateDir !== '' ? resolve(stateDir, 'status.json') : undefined,
    resolve(homedir(), '.dsh', 'pink-soul-dt', 'status.json'),
    resolve('.pet-state', 'status.json'),
    resolve('..', 'dsh-pet', '.state', 'status.json'),
  ].filter((value): value is string => typeof value === 'string')
}

/** Pick the newest existing candidate, or null when none exists. */
function newestStatusFile(): string | null {
  return candidateFiles()
    .filter(candidate => existsSync(candidate))
    .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)[0] ?? null
}

/** Handle one pet status request. */
function handlePetStatus(_req: IncomingMessage, res: ServerResponse): void {
  const file = newestStatusFile()
  let payload: PetStatusPayload
  try {
    const state = file !== null
      ? JSON.parse(readFileSync(file, 'utf8')) as Partial<PetState>
      : {}
    payload = {
      ok: true,
      mode: state.mode ?? 'idle',
      message: state.message ?? '',
      updated: state.updated ?? 0,
      source: file,
    }
  } catch {
    payload = { ok: true, mode: 'idle', message: '', updated: 0, source: null }
  }
  res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(payload))
}

/**
 * Mount the pet status route.
 * @param ctx - context carrying webServer.
 */
export function apply(ctx: Context): void {
  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: '/api/dsh-dt-pet/status',
    handler: handlePetStatus,
  }), 'dsh-dt-pet: /api/dsh-dt-pet/status route')
}
