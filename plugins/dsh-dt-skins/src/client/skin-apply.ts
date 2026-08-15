/**
 * Shared skin apply/clear logic for the skin center. The wallpaper is painted
 * on document.body, the app's #root frame is made transparent, and the surface
 * tokens are remapped to translucent frosted values (light or dark, per the
 * skin's theme) so the wallpaper reads through the workspace while staying
 * legible.
 * @module @masked-knight02/dsh-client-ui-dt-skins/client/skin-apply
 */

/** A minimal skin shape the apply path needs. */
export interface SkinLike {
  id: string
  bodyAttr: string
  preview: { light: string }
  theme?: 'light' | 'dark'
}

/** The injected stylesheet id (one instance, rewritten per skin). */
const STYLE_ID = 'dsh-dt-skins-scoped-style'

/** Frosted surface token values, keyed by skin theme. */
const FROSTED = {
  light: {
    base: 'rgba(255, 255, 255, 0.5)',
    layer1: 'rgba(255, 255, 255, 0.28)',
    layer2: 'rgba(255, 255, 255, 0.4)',
    layer3: 'rgba(255, 255, 255, 0.45)',
    platform: 'rgba(255, 255, 255, 0.4)',
    aionBase: 'rgba(255, 255, 255, 0.55)',
    aion1: 'rgba(255, 255, 255, 0.3)',
    aion2: 'rgba(255, 255, 255, 0.45)',
  },
  dark: {
    base: 'rgba(24, 28, 36, 0.6)',
    layer1: 'rgba(24, 28, 36, 0.4)',
    layer2: 'rgba(24, 28, 36, 0.5)',
    layer3: 'rgba(24, 28, 36, 0.55)',
    platform: 'rgba(24, 28, 36, 0.5)',
    aionBase: 'rgba(24, 28, 36, 0.6)',
    aion1: 'rgba(24, 28, 36, 0.4)',
    aion2: 'rgba(24, 28, 36, 0.5)',
  },
} as const

/** Apply one skin: body attribute, wallpaper, and translucent surface tokens. */
export function applySkin(skin: SkinLike): void {
  clearSkinAttrs()
  document.body.setAttribute(skin.bodyAttr, '')

  const frost = skin.theme === 'dark' ? FROSTED.dark : FROSTED.light

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
    // Bias left so the corner signature is not cropped by cover.
    '  background-position: left center !important;',
    '  background-attachment: fixed !important;',
    '  min-height: 100vh !important;',
    '}',
    // The app frame is transparent so the panes ride on the wallpaper.
    `body[${skin.bodyAttr}] [id='root'] {`,
    '  background: transparent !important;',
    '}',
    // The sidebar column is transparent so the left wallpaper reads through.
    `body[${skin.bodyAttr}] [data-pane='sidebar'] {`,
    '  background: transparent !important;',
    '}',
    // Frost the surface tokens so the wallpaper reads through while legible.
    `body[${skin.bodyAttr}] {`,
    `  --dsw-alias-bg-base: ${frost.base} !important;`,
    `  --dsw-alias-bg-layer-1: ${frost.layer1} !important;`,
    `  --dsw-alias-bg-layer-2: ${frost.layer2} !important;`,
    `  --dsw-alias-bg-layer-3: ${frost.layer3} !important;`,
    `  --dsw-alias-bg-module-platform: ${frost.platform} !important;`,
    `  --aion-bg-base: ${frost.aionBase} !important;`,
    `  --aion-bg-1: ${frost.aion1} !important;`,
    `  --aion-bg-2: ${frost.aion2} !important;`,
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
