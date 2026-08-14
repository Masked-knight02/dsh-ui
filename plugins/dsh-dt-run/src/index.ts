/**
 * @masked-knight02/dsh-client-ui-dt-run - host half: a tiny health route for
 * the task-run plugin. The actual task execution happens in the browser half
 * through dsh's real session machinery (workspace connect, session rename,
 * session.prompt); the host half only confirms the plugin is mounted in the
 * host composition.
 *
 * @module @masked-knight02/dsh-client-ui-dt-run
 */

import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-host-webserver'

/** Required services: the route registry. */
export const inject = ['webServer']

/** The JSON envelope of the health route. */
export interface RunHealthPayload {
  ok: boolean
  name: string
  version: string
}

/** Handle one health request. */
function handleHealth(_req: IncomingMessage, res: ServerResponse): void {
  const payload: RunHealthPayload = {
    ok: true,
    name: 'dsh-dt-run',
    version: '0.1.0',
  }
  res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(payload))
}

/**
 * Mount the health route.
 * @param ctx - context carrying webServer.
 */
export function apply(ctx: Context): void {
  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: '/api/dsh-dt-run/health',
    handler: handleHealth,
  }), 'dsh-dt-run: /api/dsh-dt-run/health route')
}
