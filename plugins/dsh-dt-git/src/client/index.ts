/**
 * dsh-dt-git browser half: a sidebar entry row injected next to the shell's
 * New Session button (DOM-level extension, self-healing via a
 * MutationObserver) and a Git graph panel rendered from the host
 * /api/dsh-dt-git/overview route for the active workspace.
 *
 * @module @masked-knight02/dsh-client-ui-dt-git/client
 */

import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import { GitGraphPanel } from './GitGraphPanel.tsx'

/** Stable data attribute identifying the injected entry row. */
export const ENTRY_SELECTOR = '[data-dsh-dt-git-entry]'

/** Inline icon matching the shell's 16px nav-icon look. */
const ICON = `<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="4" cy="4" r="1.6"/><circle cx="12" cy="12" r="1.6"/><path d="M4 5.6v2.2c0 1.2.9 2.2 2.2 2.2h3.6"/><path d="M12 10.4V7.5c0-.9-.7-1.6-1.6-1.6h-1.9"/></svg>`

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

/** The entry row toggles the git graph panel. */
function createEntry(onToggle: () => void): HTMLButtonElement {
  const entry = document.createElement('button')
  entry.type = 'button'
  entry.dataset.dshDtGitEntry = ''
  entry.style.cssText = 'display:flex;align-items:center;gap:8px;width:100%;padding:8px 12px;border:0;background:transparent;color:inherit;cursor:pointer;font:inherit;font-size:13px'
  entry.innerHTML = `<span style="display:inline-flex">${ICON}</span><span>Git 图谱</span>`
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
 * Mount the sidebar entry and the git graph panel.
 * @param ctx - client root context (workspaces for the active workspace path).
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

    /** Resolve the active workspace path from the workspaces baseline. */
    const activeWorkspacePath = (): string | undefined => {
      const snapshot = ctx.workspaces?.list.getSnapshot()
      if (snapshot === undefined) return undefined
      const activeId = snapshot.recentWorkspaceId
      if (activeId === undefined) return undefined
      const workspace = snapshot.items.find(item => item.workspaceId === activeId)
      return workspace?.path
    }

    const openPanel = (): void => {
      if (open) {
        closePanel()
        return
      }
      open = true
      panelHost = document.createElement('div')
      panelHost.id = 'dsh-dt-git-panel-host'
      document.body.appendChild(panelHost)
      root = createRoot(panelHost)
      root.render(createElement(GitGraphPanel, {
        onClose: closePanel,
        workspacePath: activeWorkspacePath,
      }))
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

    return () => {
      waitObserver.disconnect()
      rootObserver.disconnect()
      entry.remove()
      closePanel()
    }
  }, 'dsh-dt-git: sidebar entry')
}
