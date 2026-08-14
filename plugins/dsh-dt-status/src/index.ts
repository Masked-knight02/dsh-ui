/**
 * @masked-knight02/dsh-client-ui-dt-status - host half: a live status route
 * that reads the real workspace registry and reports what dsh web knows.
 * The browser half (exports "./client") renders the sidebar entry and the
 * status panel from this route's JSON.
 *
 * @module @masked-knight02/dsh-client-ui-dt-status
 */

import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-host-webserver'
import type {} from '@deepseek-ai/dsh-workspace'

/** Required services: the route registry and the workspace registry. */
export const inject = ['webServer', 'workspaceRegistry']

/** The JSON envelope of the status route. */
export interface DtStatusPayload {
  ok: boolean
  name: string
  version: string
  workspaces: Array<{ id: string; path: string }>
  uptimeMs: number
}

/** Handle one status request. */
function handleStatus(ctx: Context, started: number, _req: IncomingMessage, res: ServerResponse): void {
  const workspaces = ctx.workspaceRegistry.list().map(workspace => ({
    id: workspace.id,
    path: workspace.path,
  }))
  const payload: DtStatusPayload = {
    ok: true,
    name: 'dsh-dt-status',
    version: '0.1.0',
    workspaces,
    uptimeMs: Date.now() - started,
  }
  res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(payload))
}

/**
 * Mount the status route.
 * @param ctx - context carrying webServer and workspaceRegistry.
 */
export function apply(ctx: Context): void {
  const started = Date.now()
  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: '/api/dsh-dt-status',
    handler: (req, res) => handleStatus(ctx, started, req, res),
  }), 'dsh-dt-status: /api/dsh-dt-status route')
}
