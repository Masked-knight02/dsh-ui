/**
 * Consumer-side build for git installs (the `prepare` script): transpile
 * straight from src without tsc project references (types are NOT checked
 * here - `pnpm run typecheck` owns that).
 */
import { clientBundle } from './build/tsdown.client.ts'

export default clientBundle('@masked-knight02/dsh-client-ui-skin-taozhe-light', [
  'src/index.ts',
])
