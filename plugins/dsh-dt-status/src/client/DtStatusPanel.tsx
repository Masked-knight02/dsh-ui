/**
 * The status panel: fetches the host /api/dsh-dt-status route and renders
 * the real workspace list and uptime. Pure presentation; data arrives
 * through the route.
 * @module @masked-knight02/dsh-client-ui-dt-status/client/DtStatusPanel
 */

import { useEffect, useState } from 'react'

/** The status payload mirrored from the host route. */
export interface DtStatus {
  ok: boolean
  name: string
  version: string
  workspaces: Array<{ id: string; path: string }>
  uptimeMs: number
}

/** Panel props. */
export interface DtStatusPanelProps {
  onClose: () => void
}

/** Render the live status panel. */
export function DtStatusPanel({ onClose }: DtStatusPanelProps): JSX.Element {
  const [status, setStatus] = useState<DtStatus | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let live = true
    fetch('/api/dsh-dt-status', { cache: 'no-store' })
      .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return response.json() as Promise<DtStatus>
      })
      .then(data => { if (live) setStatus(data) })
      .catch((cause: unknown) => { if (live) setError(cause instanceof Error ? cause.message : String(cause)) })
    return () => { live = false }
  }, [])

  const uptime = status !== null ? Math.floor(status.uptimeMs / 1000) : 0

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
          width: 420,
          maxWidth: '92vw',
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
            <div style={{ fontSize: 10, letterSpacing: '.1em', color: '#999' }}>MY PLUGIN</div>
            <h2 style={{ fontSize: 18, margin: '6px 0 4px' }}>DSH 状态</h2>
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

        {status === null && error === null && <p style={{ color: '#777', fontSize: 13 }}>读取中...</p>}
        {error !== null && <p style={{ color: '#b04a45', fontSize: 13 }}>读取失败：{error}</p>}
        {status !== null && (
          <>
            <div style={{ display: 'flex', gap: 10, margin: '14px 0' }}>
              <div style={{ flex: 1, border: '1px solid #e4e5df', borderRadius: 9, padding: 12 }}>
                <div style={{ fontSize: 10, color: '#999' }}>插件</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>{status.name}</div>
              </div>
              <div style={{ flex: 1, border: '1px solid #e4e5df', borderRadius: 9, padding: 12 }}>
                <div style={{ fontSize: 10, color: '#999' }}>运行时间</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>{uptime}s</div>
              </div>
            </div>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
              已注册工作区（{status.workspaces.length}）
            </div>
            {status.workspaces.length === 0 && <p style={{ color: '#aaa', fontSize: 12 }}>暂无工作区</p>}
            {status.workspaces.map(workspace => (
              <div
                key={workspace.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '9px 10px',
                  borderBottom: '1px solid #f0f1ec',
                  fontSize: 12,
                }}
              >
                <code style={{ color: '#4c6a8f' }}>{workspace.id}</code>
                <span style={{ color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {workspace.path}
                </span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
