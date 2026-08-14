/**
 * dsh-dt-skins browser half: a sidebar entry row injected next to the shell's
 * New Session button (DOM-level extension, self-healing via a
 * MutationObserver) and a skin-center panel rendered from the host
 * /api/dsh-dt-skins/registry route.
 *
 * @module @masked-knight02/dsh-client-ui-dt-skins/client
 */

import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import { SkinCenterPanel } from './SkinCenterPanel.tsx'

/** Stable data attribute identifying the injected entry row. */
export const ENTRY_SELECTOR = '[data-dsh-dt-skins-entry]'

/** Inline icon matching the shell's 16px nav-icon look. */
const ICON = `<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 4.5A2.5 2.5 0 0 1 4.5 2h7A2.5 2.5 0 0 1 14 4.5v7a2.5 2.5 0 0 1-2.5 2.5h-7A2.5 2.5 0 0 1 2 11.5z"/><circle cx="8" cy="8" r="2.2"/><path d="M4 14l2.4-1.6L10 14"/></svg>`

/** Find the sidebar shell root element, or undefined while not yet mounted. */
function sidebarRoot(): HTMLElement | undefined {
  const column = document.querySelector<HTMLElement>('[data-pane="sidebar"], [class*="sidebarCol"]')
  if (column === null) return undefined
  const logoOwner = column.querySelector<HTMLElement>('[class*="logoRow"]')?.parentElement
  return logoOwner ?? (column.firstElementChild as HTMLElement | undefined)
}

/** The New Session button: nested in the logo row on current shells. */
function newSessionButton(root: HTMLElement): HTMLButtonElement | undefined {
  const nested = root.querySelector<HTMLButtonElement>('button[class*="newSession"]')
  if (nested !== null) return nested
  for (const child of root.children) {
    if (child.tagName === 'BUTTON') return child as HTMLButtonElement
  }
  return undefined
}

/** The entry row toggles the skin-center panel. */
function createEntry(onToggle: () => void): HTMLButtonElement {
  const entry = document.createElement('button')
  entry.type = 'button'
  entry.dataset.dshDtSkinsEntry = ''
  entry.style.cssText = 'display:flex;align-items:center;gap:8px;width:100%;padding:8px 12px;border:0;background:transparent;color:inherit;cursor:pointer;font:inherit;font-size:13px'
  entry.innerHTML = `<span style="display:inline-flex">${ICON}</span><span>皮肤中心</span>`
  entry.addEventListener('click', onToggle)
  return entry
}

/** Re-insert the entry after the New Session row. */
function placeEntry(root: HTMLElement, entry: HTMLButtonElement): boolean {
  const button = newSessionButton(root)
  if (button === undefined) return false
  if (entry.parentElement !== root) {
    root.insertBefore(entry, button.nextElementSibling)
  }
  return true
}

/**
 * Mount the sidebar entry and the skin-center panel.
 * @param ctx - client root context (unused beyond mount lifecycle here).
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => {
    let panelHost: HTMLDivElement | null = null
    let root: ReturnType<typeof createRoot> | null = null
    let open = false

    const closePanel = (): void => {
      open = false
      if (root !== null) {
        root.unmount()
        root = null
      }
      if (panelHost !== null) {
        panelHost.remove()
        panelHost = null
      }
    }

    const openPanel = (): void => {
      if (open) {
        closePanel()
        return
      }
      open = true
      panelHost = document.createElement('div')
      panelHost.id = 'dsh-dt-skins-panel-host'
      document.body.appendChild(panelHost)
      root = createRoot(panelHost)
      root.render(createElement(SkinCenterPanel, { onClose: closePanel }))
    }

    const entry = createEntry(openPanel)
    let sidebar: HTMLElement | undefined
    let placed = false

    const tryPlace = (): void => {
      if (sidebar !== undefined && !sidebar.isConnected) {
        sidebar = undefined
        placed = false
      }
      if (placed) {
        if (document.body.contains(entry)) return
        sidebar = undefined
        placed = false
      }
      sidebar ??= sidebarRoot()
      if (sidebar === undefined) return
      placed = placeEntry(sidebar, entry)
    }

    const waitObserver = new MutationObserver(() => { tryPlace() })
    waitObserver.observe(document.body, { childList: true, subtree: true })

    const rootObserver = new MutationObserver(() => {
      if (sidebar === undefined || !sidebar.isConnected) {
        placed = false
        tryPlace()
        return
      }
      if (!sidebar.contains(entry)) placed = placeEntry(sidebar, entry)
    })

    tryPlace()

    // Auto-apply the persisted active skin (or the first skin as default) on
    // load, so the wallpaper is visible without opening the panel.
    void (async () => {
      try {
        const response = await fetch('/api/dsh-dt-skins/registry', { cache: 'no-store' })
        const data = await response.json() as { ok: boolean; skins: Array<{ id: string; bodyAttr: string; preview: { light: string } }> }
        const skins = data.skins ?? []
        if (skins.length === 0) return
        const activeId = localStorage.getItem('dsh.skin.active')
        const skin = skins.find(item => item.id === activeId) ?? skins[0]
        document.body.setAttribute(skin.bodyAttr, '')
        document.body.style.backgroundImage = `url("${skin.preview.light}")`
        document.body.style.backgroundSize = 'cover'
        document.body.style.backgroundPosition = 'center'
        if (activeId !== skin.id) localStorage.setItem('dsh.skin.active', skin.id)
      } catch {
        // A transient failure keeps the previous background.
      }
    })()

    return () => {
      waitObserver.disconnect()
      rootObserver.disconnect()
      entry.remove()
      closePanel()
    }
  }, 'dsh-dt-skins: sidebar entry')
}
