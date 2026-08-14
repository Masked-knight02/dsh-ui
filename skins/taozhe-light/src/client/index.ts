/**
 * Taozhe Light skin: a background-image skin that scopes a full-window
 * wallpaper under the `data-dsh-skin-taozhe-light` body attribute. apply()
 * owns the body attribute and the injected style tag, and retracts both on
 * dispose (write-only-what-you-own discipline). No services are injected:
 * the skin needs only the DOM.
 * @module @masked-knight02/dsh-client-ui-skin-taozhe-light/client
 */

import type { Context } from '@deepseek-ai/cordis'

/** The body attribute this skin writes and scopes its stylesheet on. */
const BODY_ATTR = 'data-dsh-skin-taozhe-light'

/** The wallpaper asset, served by the shell's static route. */
const WALLPAPER_URL = '/skins/taozhe-light.png'

/**
 * Apply the taozhe-light skin: body attribute plus a scoped background rule.
 * @param ctx - owning context (the effect lifecycle owns retraction).
 */
export function apply(ctx: Context): void {
  const body = document.body
  body.setAttribute(BODY_ATTR, '')

  const style = document.createElement('style')
  style.dataset.skinTaozheLight = ''
  style.textContent = [
    `body[${BODY_ATTR}] {`,
    `  background-image: url("${WALLPAPER_URL}") !important;`,
    '  background-size: cover;',
    '  background-position: center;',
    '  background-repeat: no-repeat;',
    '}',
  ].join('\n')
  document.head.append(style)

  ctx.effect(() => () => {
    body.removeAttribute(BODY_ATTR)
    style.remove()
  }, 'ui-skin-taozhe-light: wallpaper')
}
