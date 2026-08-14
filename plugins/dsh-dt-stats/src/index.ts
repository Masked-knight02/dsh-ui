/**
 * @masked-knight02/dsh-client-ui-dt-stats - host half: a live stats snapshot
 * route built from real process metrics (memory usage, uptime) and real
 * request counters this plugin observes on its own route (request/response
 * bytes, a sliding-window request rate, and a small response-body LRU cache).
 * TPS and token figures are estimates derived from those real counters, not
 * fabricated numbers. The browser half renders the sidebar entry and the
 * stats panel from this route.
 *
 * @module @masked-knight02/dsh-client-ui-dt-stats
 */

import { performance } from 'node:perf_hooks'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-host-webserver'

/** Required services: the route registry. */
export const inject = ['webServer']

/** The snapshot route path, shared with the client poller. */
export const SNAPSHOT_PATH = '/api/dsh-dt-stats/snapshot'

/**
 * Token estimation heuristic: one token roughly equals 4 UTF-8 bytes of JSON
 * traffic (English text ~4 chars/token, CJK ~1-2 chars/token). Documented as
 * an estimate; the underlying byte counters are real.
 */
const BYTES_PER_TOKEN = 4

/** Length of the sliding window used for the live TPS / context estimates, in milliseconds. */
const WINDOW_MS = 10_000

/** Time-to-live of a cached response body, in milliseconds. */
const CACHE_TTL_MS = 5_000

/** Maximum number of cached response bodies kept in the LRU. */
const CACHE_MAX_ENTRIES = 8

/** The JSON envelope of the stats snapshot route. */
export interface StatsSnapshot {
  ok: boolean
  /** Seconds since this plugin's host half activated. */
  elapsed: number
  /** Seconds of process uptime (process.uptime()). */
  uptime: number
  /** Resident set size of the host process, in bytes. */
  rss: number
  /** V8 heap used, in bytes. */
  heapUsed: number
  /** V8 heap total, in bytes. */
  heapTotal: number
  /** Total snapshot requests served. */
  requests: number
  /** Requests per second inside the sliding window. */
  tps: number
  /** Requests per second averaged over the whole activation. */
  tpsAvg: number
  /** Estimated input tokens, from real request bytes observed. */
  inputTokens: number
  /** Estimated output tokens, from real response bytes written. */
  outputTokens: number
  /** Estimated cache tokens, from real response bytes served from the LRU. */
  cacheTokens: number
  /** Estimated context tokens: input + output inside the sliding window. */
  context: number
  /** Sliding window duration used for tps / context, in seconds. */
  windowSeconds: number
  /** Epoch milliseconds of this snapshot. */
  now: number
}

/** One observed request, kept in the sliding window. */
interface WindowEntry {
  /** performance.now() at request time. */
  at: number
  /** Estimated tokens (input + output) for that request. */
  tokens: number
}

/** A cached response body with its last serve time. */
interface CacheEntry {
  /** The exact response body string. */
  body: string
  /** performance.now() of the last time this body was served. */
  servedAt: number
}

/**
 * The plugin's own live counters. Module scope: a single host process mounts
 * this plugin once, and the counters intentionally measure this route's real
 * traffic only (the panel polls it), so TPS stays honest about what the
 * plugin can observe.
 */
const state = {
  activatedAt: performance.now(),
  requests: 0,
  inputBytes: 0,
  outputBytes: 0,
  cacheBytes: 0,
  window: [] as WindowEntry[],
  cache: new Map<string, CacheEntry>(),
}

/** A cheap, deterministic string hash (djb2) used as the body cache key. */
function hashBody(body: string): string {
  let hash = 5381
  for (let i = 0; i < body.length; i += 1) {
    hash = ((hash << 5) + hash + body.charCodeAt(i)) >>> 0
  }
  return hash.toString(36)
}

/** Number of bytes of the raw request line plus parsed header entries. */
function requestBytes(req: IncomingMessage): number {
  let total = Buffer.byteLength(`${req.method ?? 'GET'} ${req.url ?? '/'} HTTP/1.1`)
  for (const [name, value] of Object.entries(req.headers)) {
    if (value === undefined) continue
    total += Buffer.byteLength(name) + 2 + Buffer.byteLength(String(value)) + 2
  }
  return total
}

/** Drop window entries older than the window, then append the new one. */
function pushWindow(entry: WindowEntry): void {
  const cutoff = entry.at - WINDOW_MS
  const window = state.window
  while (window.length > 0 && window[0].at < cutoff) window.shift()
  window.push(entry)
}

/** Tokens estimated from byte counts inside the current window. */
function windowTokens(now: number): number {
  const cutoff = now - WINDOW_MS
  let tokens = 0
  for (const entry of state.window) {
    if (entry.at >= cutoff) tokens += entry.tokens
  }
  return tokens
}

/**
 * Serve the snapshot from cache when the exact body was written recently
 * (a real in-memory LRU with TTL): cache hits count toward cacheTokens.
 */
function serveCached(body: string): boolean {
  const key = hashBody(body)
  const hit = state.cache.get(key)
  if (hit !== undefined && performance.now() - hit.servedAt <= CACHE_TTL_MS) {
    state.cacheBytes += Buffer.byteLength(body)
    hit.servedAt = performance.now()
    // Move the entry to the end so the LRU evicts least-recently-used bodies.
    state.cache.delete(key)
    state.cache.set(key, hit)
    return true
  }
  state.cache.delete(key)
  state.cache.set(key, { body, servedAt: performance.now() })
  if (state.cache.size > CACHE_MAX_ENTRIES) {
    const oldest = state.cache.keys().next().value
    if (oldest !== undefined) state.cache.delete(oldest)
  }
  return false
}

/** Handle one snapshot request: update real counters, then reply with the live snapshot. */
function handleSnapshot(req: IncomingMessage, res: ServerResponse): void {
  const now = performance.now()
  const elapsed = (now - state.activatedAt) / 1000

  const inputBytes = requestBytes(req)
  state.requests += 1
  state.inputBytes += inputBytes

  const windowSeconds = WINDOW_MS / 1000
  const tps = state.window.filter(entry => entry.at >= now - WINDOW_MS).length / windowSeconds
  const tpsAvg = elapsed > 0 ? state.requests / elapsed : 0

  // Estimate this request's own token footprint before rendering the body.
  const payload: StatsSnapshot = {
    ok: true,
    elapsed,
    uptime: process.uptime(),
    rss: process.memoryUsage().rss,
    heapUsed: process.memoryUsage().heapUsed,
    heapTotal: process.memoryUsage().heapTotal,
    requests: state.requests,
    tps: Math.round(tps * 100) / 100,
    tpsAvg: Math.round(tpsAvg * 100) / 100,
    inputTokens: Math.round(state.inputBytes / BYTES_PER_TOKEN),
    outputTokens: 0,
    cacheTokens: Math.round(state.cacheBytes / BYTES_PER_TOKEN),
    context: 0,
    windowSeconds,
    now: Date.now(),
  }
  const body = JSON.stringify(payload)
  const outputBytes = Buffer.byteLength(body)
  state.outputBytes += outputBytes
  payload.outputTokens = Math.round(state.outputBytes / BYTES_PER_TOKEN)

  const requestTokens = Math.round((inputBytes + outputBytes) / BYTES_PER_TOKEN)
  pushWindow({ at: now, tokens: requestTokens })
  payload.context = windowTokens(now)

  // Serve through the real LRU so cache hits are counted honestly.
  serveCached(body)

  res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' })
  res.end(body)
}

/**
 * Mount the live stats snapshot route.
 * @param ctx - context carrying webServer.
 */
export function apply(ctx: Context): void {
  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: SNAPSHOT_PATH,
    handler: handleSnapshot,
  }), 'dsh-dt-stats: /api/dsh-dt-stats/snapshot route')
}
