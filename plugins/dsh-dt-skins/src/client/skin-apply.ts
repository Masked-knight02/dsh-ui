/**
 * Shared skin apply/clear logic for the skin center. The wallpaper is painted
 * on document.body, the app's #root frame is made transparent, and the aion
 * surface tokens are remapped to translucent frosted values so the wallpaper
 * reads through the workspace itself (reference dsh-web-ui backdrop style).
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

/** Apply one skin: body attribute, wallpaper, and translucent surface tokens. */
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
    '  min-height: 100vh !important;',
    '}',
    // The app frame is transparent so the panes ride on the wallpaper.
    `body[${skin.bodyAttr}] [id='root'] {`,
    '  background: transparent !important;',
    '}',
    // Frost the aion surface tokens so the workspace reads the wallpaper
    // while staying legible.
    `body[${skin.bodyAttr}] {`,
    '  --aion-bg-base: rgba(255, 255, 255, 0.55) !important;',
    '  --aion-bg-1: rgba(255, 255, 255, 0.42) !important;',
    '  --aion-bg-2: rgba(255, 255, 255, 0.5) !important;',
    '  --aion-bg-3: rgba(168, 184, 216, 0.22) !important;',
    '  --aion-bg-4: rgba(168, 184, 216, 0.32) !important;',
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
