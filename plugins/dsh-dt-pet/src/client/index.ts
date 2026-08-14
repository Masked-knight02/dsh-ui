/**
 * dsh-dt-pet browser half: a sidebar entry row injected next to the shell's
 * New Session button (DOM-level extension, self-healing via a
 * MutationObserver) and a pet status panel rendered from the host
 * /api/dsh-dt-pet/status route.
 *
 * @module @masked-knight02/dsh-client-ui-dt-pet/client
 */

import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import { PetStatusPanel } from './PetStatusPanel.tsx'
import { TaozhePet } from './TaozhePet.tsx'

/** Stable data attribute identifying the injected entry row. */
export const ENTRY_SELECTOR = '[data-dsh-dt-pet-entry]'

/** Inline icon matching the shell's 16px nav-icon look. */
const ICON = `<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 9.5c0-2 1.2-4 2.5-4s2 2.6 2 4c0 1.1-.7 1.5-1.2 1.5S5.6 10.9 5 10.5s-.4-.2-.8-.4C3.7 9.9 3.5 10 3.5 9.5z"/><circle cx="11" cy="7" r="2.2"/><path d="M4 13c1.5 1 6.5 1 8 0"/></svg>`

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

/** The entry row toggles the pet status panel. */
function createEntry(onToggle: () => void): HTMLButtonElement {
  const entry = document.createElement('button')
  entry.type = 'button'
  entry.dataset.dshDtPetEntry = ''
  entry.style.cssText = 'display:flex;align-items:center;gap:8px;width:100%;padding:8px 12px;border:0;background:transparent;color:inherit;cursor:pointer;font:inherit;font-size:13px'
  entry.innerHTML = `<span style="display:inline-flex">${ICON}</span><span>桌宠状态</span>`
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
 * Mount the sidebar entry and the pet status panel.
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
      panelHost.id = 'dsh-dt-pet-panel-host'
      document.body.appendChild(panelHost)
      root = createRoot(panelHost)
      root.render(createElement(PetStatusPanel, { onClose: closePanel }))
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

    // Floating animated pet widget (always visible, dismissible).
    const petHost = document.createElement('div')
    petHost.id = 'dsh-dt-pet-widget-host'
    document.body.appendChild(petHost)
    const petRoot = createRoot(petHost)
    petRoot.render(createElement(TaozhePet))

    return () => {
      waitObserver.disconnect()
      rootObserver.disconnect()
      entry.remove()
      closePanel()
      petRoot.unmount()
      petHost.remove()
    }
  }, 'dsh-dt-pet: sidebar entry')
}
