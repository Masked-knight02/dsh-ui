/**
 * The skin-center panel: lists the skins reported by the host
 * /api/dsh-dt-skins/registry route and applies a skin by its body attribute
 * and wallpaper preview. The active skin id persists in localStorage
 * (dsh.skin.active). Pure presentation; data arrives through the route.
 * @module @masked-knight02/dsh-client-ui-dt-skins/client/SkinCenterPanel
 */

import { useEffect, useState } from 'react'

/** A skin manifest mirrored from the host route. */
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

/** Panel props. */
export interface SkinCenterPanelProps {
  onClose: () => void
}

/** The localStorage key backing the active skin. */
const ACTIVE_KEY = 'dsh.skin.active'

/** Remove every data-dsh-skin-* body attribute previously written by a skin. */
function clearSkinAttrs(): void {
  for (const attr of Array.from(document.body.attributes)) {
    if (attr.name.startsWith('data-dsh-skin-')) document.body.removeAttribute(attr.name)
  }
  document.body.style.backgroundImage = ''
}

/** Apply one skin by its body attribute and wallpaper preview. */
function applySkin(skin: SkinManifest): void {
  clearSkinAttrs()
  document.body.setAttribute(skin.bodyAttr, '')
  document.body.style.backgroundImage = `url("${skin.preview.light}")`
  document.body.style.backgroundSize = 'cover'
  document.body.style.backgroundPosition = 'center'
  localStorage.setItem(ACTIVE_KEY, skin.id)
}

/** Render the skin-center panel. */
export function SkinCenterPanel({ onClose }: SkinCenterPanelProps): JSX.Element {
  const [skins, setSkins] = useState<SkinManifest[]>([])
  const [active, setActive] = useState<string | null>(() => localStorage.getItem(ACTIVE_KEY))

  useEffect(() => {
    let live = true
    const load = async (): Promise<void> => {
      try {
        const response = await fetch('/api/dsh-dt-skins/registry', { cache: 'no-store' })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const data = await response.json() as { ok: boolean; skins: SkinManifest[] }
        if (live) setSkins(data.skins ?? [])
      } catch {
        // Keep the last known list; a transient failure is not fatal.
      }
    }
    void load()
    return () => { live = false }
  }, [])

  const reset = (): void => {
    clearSkinAttrs()
    localStorage.removeItem(ACTIVE_KEY)
    setActive(null)
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0,0,0,.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 460,
          maxWidth: '92vw',
          maxHeight: '84vh',
          overflow: 'auto',
          background: '#fff',
          borderRadius: 12,
          padding: 22,
          boxShadow: '0 18px 44px rgba(0,0,0,.28)',
          fontFamily: 'system-ui, sans-serif',
        }}
        onClick={event => event.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: '.1em', color: '#999' }}>SKIN CENTER</div>
            <h2 style={{ fontSize: 18, margin: '6px 0 4px' }}>皮肤中心</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ border: 0, background: 'transparent', color: '#999', cursor: 'pointer', fontSize: 16 }}
            aria-label="关闭"
          >
            ×
          </button>
        </div>

        <div style={{ margin: '16px 0 10px', display: 'flex', gap: 8 }}>
          <span style={{ fontSize: 12, color: '#888' }}>已收录 {skins.length} 个皮肤</span>
          <button
            type="button"
            onClick={reset}
            style={{
              marginLeft: 'auto',
              border: '1px solid #e0e1dc',
              background: '#f7f7f4',
              borderRadius: 7,
              padding: '5px 10px',
              fontSize: 11,
              color: '#777',
              cursor: 'pointer',
            }}
          >
            重置为默认
          </button>
        </div>

        {skins.length === 0 && (
          <div style={{ padding: '24px 0', textAlign: 'center', color: '#aaa', fontSize: 12 }}>
            暂无皮肤（在 skins/ 下新建 &lt;id&gt;/skin.json 即可收录）
          </div>
        )}

        {skins.map(skin => {
          const isActive = active === skin.id
          return (
            <div
              key={skin.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 0',
                borderBottom: '1px solid #eee',
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 8,
                  background: skin.accent,
                  flex: 'none',
                  boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.06)',
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ display: 'block', fontSize: 13, color: '#444' }}>
                  {skin.name} <span style={{ fontWeight: 400, color: '#aaa', fontSize: 11 }}>{skin.nameEn}</span>
                </strong>
                <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{skin.tagline}</div>
              </div>
              <button
                type="button"
                onClick={() => { applySkin(skin); setActive(skin.id) }}
                style={{
                  border: isActive ? '1px solid #78917b' : '1px solid #e0e1dc',
                  background: isActive ? '#e3eee5' : '#f7f7f4',
                  borderRadius: 7,
                  padding: '6px 12px',
                  fontSize: 11,
                  color: isActive ? '#4e7a55' : '#777',
                  cursor: 'pointer',
                }}
              >
                {isActive ? '已启用' : '应用'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
