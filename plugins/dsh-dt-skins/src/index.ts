/**
 * @masked-knight02/dsh-client-ui-dt-skins - host half: a skin registry route
 * that discovers skins under skins/*/skin.json and reports their manifests.
 * The browser half renders the sidebar entry and the skin-center panel from
 * this route. A skin is added by dropping a skins/<id>/ directory with a
 * valid skin.json; no registry file needs editing.
 *
 * @module @masked-knight02/dsh-client-ui-dt-skins
 */

import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-host-webserver'

/** Required services: the route registry. */
export const inject = ['webServer']

/** A skin manifest mirroring skins/<id>/skin.json. */
export interface SkinManifest {
  id: string
  name: string
  nameEn: string
  author: string
  tagline: string
  description: string
  tags: string[]
  accent: string
  bodyAttr: string
  package: string
  preview: { light: string; dark: string }
  order: number
}

/** The skin registry payload. */
export interface SkinRegistryPayload {
  ok: boolean
  skins: SkinManifest[]
}

/** Resolve the skins directory (env override, else repo-root skins/). */
function skinsDir(): string {
  const override = process.env.DSH_SKINS_DIR
  return override !== undefined && override !== '' ? resolve(override) : resolve('skins')
}

/** Discover skins/*/skin.json and return valid manifests in order. */
function listSkins(): SkinManifest[] {
  const dir = skinsDir()
  let entries: string[] = []
  try {
    entries = readdirSync(dir, { withFileTypes: true })
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name)
  } catch {
    return []
  }
  const skins: SkinManifest[] = []
  for (const id of entries.sort()) {
    try {
      const raw = readFileSync(resolve(dir, id, 'skin.json'), 'utf8')
      skins.push(JSON.parse(raw) as SkinManifest)
    } catch {
      // Skip directories without a valid skin.json.
    }
  }
  return skins.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}

/** Handle one skin registry request. */
function handleRegistry(_req: IncomingMessage, res: ServerResponse): void {
  res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
  res.end(JSON.stringify({ ok: true, skins: listSkins() } satisfies SkinRegistryPayload))
}

/**
 * Mount the skin registry route.
 * @param ctx - context carrying webServer.
 */
export function apply(ctx: Context): void {
  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: '/api/dsh-dt-skins/registry',
    handler: handleRegistry,
  }), 'dsh-dt-skins: /api/dsh-dt-skins/registry route')
}
