/**
 * Browser half of the dsh-dt-ui family aggregate: no client behavior of its
 * own. Every dsh-dt-* feature plugin ships its own browser half (exports
 * "./client"), loaded through that child package's dsh.client declaration;
 * this aggregate merely bundles their patch rows so one install activates
 * the whole family.
 *
 * @module @masked-knight02/dsh-client-ui-dt-all/client
 */
import type { Context } from '@deepseek-ai/cordis'

/** Required services: none. */
export const inject = [] as const

/** Client plugin body: nothing to do. */
export function apply(_ctx: Context): void {}
