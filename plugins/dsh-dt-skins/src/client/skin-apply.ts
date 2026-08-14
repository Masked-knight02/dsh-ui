/**
 * Shared skin apply/clear logic for the skin center. The wallpaper is painted
 * on document.body via a scoped stylesheet, and the body is padded so the
 * app's #root window is inset and the wallpaper frames it (the dsh web shell
 * paints an opaque #root, so a body-only background would be fully covered).
 * @module @masked-knight02/dsh-client-ui-dt-skins/client/skin-apply
 */

/** A minimal skin shape the apply path needs. */
export interface SkinLike {
  id: string
  bodyAttr: string
  preview: { light: string }
}

/** The injected stylesheet id (one instance, rewritten per skin). */
const STYLE_ID = 'dsh-dt-skins-scoped-style'

/** Apply one skin: body attribute, wallpaper, and the #root inset rule. */
export function applySkin(skin: SkinLike): void {
  clearSkinAttrs()
  document.body.setAttribute(skin.bodyAttr, '')

  let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null
  if (style === null) {
    style = document.createElement('style')
    style.id = STYLE_ID
    document.head.appendChild(style)
  }
  style.textContent = [
    `body[${skin.bodyAttr}] {`,
    `  background-image: url("${skin.preview.light}") !important;`,
    '  background-size: cover !important;',
    '  background-position: center !important;',
    '  background-attachment: fixed !important;',
    '  padding: 12px !important;',
    '  box-sizing: border-box !important;',
    '  min-height: 100vh !important;',
    '}',
    `body[${skin.bodyAttr}] [id='root'] {`,
    '  background: rgba(255,255,255,0.94) !important;',
    '  border-radius: 12px !important;',
    '  box-shadow: 0 12px 40px rgba(0,0,0,0.18) !important;',
    '  overflow: hidden !important;',
    '}',
  ].join('\n')
}

/** Remove every skin write (body attribute and the scoped stylesheet). */
export function clearSkin(): void {
  clearSkinAttrs()
  document.getElementById(STYLE_ID)?.remove()
}

/** Remove every data-dsh-skin-* body attribute written by a skin. */
function clearSkinAttrs(): void {
  for (const attr of Array.from(document.body.attributes)) {
    if (attr.name.startsWith('data-dsh-skin-')) document.body.removeAttribute(attr.name)
  }
}
