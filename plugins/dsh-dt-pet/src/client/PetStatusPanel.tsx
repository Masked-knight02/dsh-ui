/**
 * The pet status panel: polls the host /api/dsh-dt-pet/status route and
 * renders the real shared pet state (mode, message, updated stamp, source
 * file). Pure presentation; data arrives through the route.
 * @module @masked-knight02/dsh-client-ui-dt-pet/client/PetStatusPanel
 */

import { useEffect, useState } from 'react'

/** The pet status payload mirrored from the host route. */
export interface PetStatus {
  ok: boolean
  mode: 'idle' | 'thinking' | 'working' | 'success' | 'error' | 'waiting'
  message: string
  updated: number
  source: string | null
}

/** Panel props. */
export interface PetStatusPanelProps {
  onClose: () => void
}

/** The mode label dictionary. */
const MODE_LABEL: Record<PetStatus['mode'], string> = {
  idle: '空闲',
  thinking: '思考中',
  working: '工作中',
  success: '成功',
  error: '出错',
  waiting: '等待',
}

/** The mode badge color dictionary. */
const MODE_COLOR: Record<PetStatus['mode'], string> = {
  idle: '#9aa0a8',
  thinking: '#b98a4e',
  working: '#5b78ae',
  success: '#5d8a63',
  error: '#b04a45',
  waiting: '#8a7bb5',
}

/** Poll interval in milliseconds. */
const POLL_MS = 700

/** Format the updated timestamp as a local time string. */
function formatTime(updated: number): string {
  if (updated <= 0) return '-'
  return new Date(updated * 1000).toLocaleTimeString()
}

/** Render the live pet status panel. */
export function PetStatusPanel({ onClose }: PetStatusPanelProps): JSX.Element {
  const [status, setStatus] = useState<PetStatus | null>(null)

  useEffect(() => {
    let live = true
    const poll = async (): Promise<void> => {
      try {
        const response = await fetch('/api/dsh-dt-pet/status', { cache: 'no-store' })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const data = await response.json() as PetStatus
        if (live) setStatus(data)
      } catch {
        // Keep the last known state; a transient failure is not fatal.
      }
    }
    void poll()
    const timer = setInterval(() => { void poll() }, POLL_MS)
    return () => {
      live = false
      clearInterval(timer)
    }
  }, [])

  const mode = status?.mode ?? 'idle'
  const color = MODE_COLOR[mode]

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
          width: 400,
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
            <h2 style={{ fontSize: 18, margin: '6px 0 4px' }}>桌宠状态</h2>
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

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0' }}>
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: color,
              boxShadow: `0 0 0 4px ${color}22`,
            }}
          />
          <span style={{ fontSize: 15, fontWeight: 600, color: '#3c3f3a' }}>{MODE_LABEL[mode]}</span>
          <code style={{ fontSize: 11, color: '#999', marginLeft: 'auto' }}>{mode}</code>
        </div>

        <div style={{ border: '1px solid #e4e5df', borderRadius: 9, padding: 12, marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: '#999', marginBottom: 4 }}>消息</div>
          <div style={{ fontSize: 13, color: '#555' }}>{status?.message !== undefined && status.message !== '' ? status.message : '-'}</div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1, border: '1px solid #e4e5df', borderRadius: 9, padding: 12 }}>
            <div style={{ fontSize: 10, color: '#999' }}>更新时间</div>
            <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4, color: '#444' }}>
              {status !== null ? formatTime(status.updated) : '-'}
            </div>
          </div>
          <div style={{ flex: 2, border: '1px solid #e4e5df', borderRadius: 9, padding: 12 }}>
            <div style={{ fontSize: 10, color: '#999' }}>状态来源</div>
            <div
              style={{
                fontSize: 10,
                marginTop: 4,
                color: '#777',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={status?.source ?? undefined}
            >
              {status?.source ?? '未找到状态文件'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
