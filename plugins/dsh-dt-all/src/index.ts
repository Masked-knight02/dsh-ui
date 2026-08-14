/**
 * Host half of the dsh-dt-ui family aggregate: no host behavior of its own.
 * The aggregate only carries the cordis.patch.yml insert rows and the
 * dependencies that pull in every dsh-dt-* feature plugin; each child
 * package's own host half (its exports ".") runs through the normal bundle
 * path.
 *
 * @module @masked-knight02/dsh-client-ui-dt-all
 */
import type { Context } from '@deepseek-ai/cordis'

/** Required services: none. */
export const inject = [] as const

/** Host plugin body: nothing to do. */
export function apply(_ctx: Context): void {}
