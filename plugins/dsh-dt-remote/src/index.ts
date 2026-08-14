/**
 * @masked-knight02/dsh-client-ui-dt-remote - host half: a live mobile pairing
 * route that mints a real one-time token (crypto.randomBytes), enumerates the
 * machine's LAN IPv4 addresses (node:os networkInterfaces), and stamps an
 * expiry deadline - everything the browser half needs to draw the QR pairing
 * grid and the phone-side link. The browser half renders the sidebar entry
 * and the pairing panel from this route.
 *
 * @module @masked-knight02/dsh-client-ui-dt-remote
 */

import { randomBytes } from 'node:crypto'
import { networkInterfaces } from 'node:os'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-host-webserver'

/** Required services: the route registry. */
export const inject = ['webServer']

/** Lifetime of one minted pair token, in milliseconds (10 minutes). */
export const PAIR_TTL_MS = 10 * 60_000

/** The JSON envelope of the pairing route. */
export interface PairPayload {
  ok: boolean
  /** One-time hex token minted for this pairing attempt. */
  token: string
  /** Non-internal IPv4 LAN addresses the GUI is reachable at. */
  addresses: string[]
  /** Server port derived from the request's Host header, or null. */
  port: number | null
  /** Expiry deadline of the token, epoch milliseconds. */
  expiresAt: number
  /** Token lifetime in milliseconds (client countdown reference). */
  ttlMs: number
}

/**
 * Enumerate the machine's reachable LAN addresses: every non-internal IPv4
 * interface address, in interface order (mirrors the reference
 * dsh-remote-web-ui lan derivation). Loopback and IPv6 are excluded - a phone
 * can only pair over a routable private address.
 * @returns the IPv4 LAN addresses (possibly empty on a loopback-only host).
 */
export function lanIPv4Addresses(): string[] {
  return Object.values(networkInterfaces()).flat()
    .filter((iface): iface is NonNullable<typeof iface> => iface !== undefined && iface.family === 'IPv4' && !iface.internal)
    .map(iface => iface.address)
}

/**
 * Derive the server port from the request's Host header (e.g. `192.168.1.7:5140`
 * yields 5140), so pair links reuse the port the browser actually reached.
 * @param req - the incoming pairing request.
 * @returns the port, or null when the header is absent or carries none.
 */
export function requestPort(req: IncomingMessage): number | null {
  const host = req.headers.host
  if (host === undefined) return null
  const match = /:(\d+)$/.exec(host)
  return match === null ? null : Number(match[1])
}

/** Handle one pairing request: mint a token and report the LAN facts. */
function handlePair(req: IncomingMessage, res: ServerResponse): void {
  const payload: PairPayload = {
    ok: true,
    token: randomBytes(16).toString('hex'),
    addresses: lanIPv4Addresses(),
    port: requestPort(req),
    expiresAt: Date.now() + PAIR_TTL_MS,
    ttlMs: PAIR_TTL_MS,
  }
  res.writeHead(200, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  })
  res.end(JSON.stringify(payload))
}

/**
 * Mount the mobile pairing route.
 * @param ctx - context carrying webServer.
 */
export function apply(ctx: Context): void {
  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: '/api/dsh-dt-remote/pair',
    handler: handlePair,
  }), 'dsh-dt-remote: /api/dsh-dt-remote/pair route')
}
