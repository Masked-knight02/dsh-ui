/**
 * The live stats panel: polls the host /api/dsh-dt-stats/snapshot route and
 * renders the real process metrics (memory, uptime) plus the TPS / context /
 * token estimates derived from the plugin's own request counters. Pure
 * presentation; data arrives through the route.
 * @module @masked-knight02/dsh-client-ui-dt-stats/client/StatsPanel
 */

import { useEffect, useState } from 'react'

/** The stats snapshot payload mirrored from the host route. */
export interface StatsSnapshot {
  ok: boolean
  /** Seconds since the host half activated. */
  elapsed: number
  /** Seconds of process uptime. */
  uptime: number
  /** Resident set size of the host process, in bytes. */
  rss: number
  /** V8 heap used, in bytes. */
  heapUsed: number
  /** V8 heap total, in bytes. */
  heapTotal: number
  /** Total snapshot requests served. */
  requests: number
  /** Requests per second inside the sliding window. */
  tps: number
  /** Requests per second averaged over the whole activation. */
  tpsAvg: number
  /** Estimated input tokens. */
  inputTokens: number
  /** Estimated output tokens. */
  outputTokens: number
  /** Estimated cache tokens. */
  cacheTokens: number
  /** Estimated context tokens in the sliding window. */
  context: number
  /** Sliding window duration in seconds. */
  windowSeconds: number
  /** Epoch milliseconds of the snapshot. */
  now: number
}

/** Panel props. */
export interface StatsPanelProps {
  onClose: () => void
}

/** Poll interval in milliseconds. */
const POLL_MS = 1000

/** Format a byte count as megabytes with one decimal. */
function formatMegabytes(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** Format a seconds count as a compact h/m/s duration. */
function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '-'
  const total = Math.floor(seconds)
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const rest = total % 60
  if (hours > 0) return `${hours}h ${minutes}m ${rest}s`
  if (minutes > 0) return `${minutes}m ${rest}s`
  return `${rest}s`
}

/** Format a count with thousands separators. */
function formatNumber(value: number): string {
  return Math.round(value).toLocaleString('en-US')
}

/** A single labeled stat card. */
function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }): JSX.Element {
  return (
    <div style={{ flex: 1, border: '1px solid #e4e5df', borderRadius: 9, padding: 12 }}>
      <div style={{ fontSize: 10, color: '#999' }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4, color: '#444' }}>{value}</div>
      {hint !== undefined ? <div style={{ fontSize: 10, color: '#aaa', marginTop: 2 }}>{hint}</div> : null}
    </div>
  )
}

/** Render the live stats panel. */
export function StatsPanel({ onClose }: StatsPanelProps): JSX.Element {
  const [snapshot, setSnapshot] = useState<StatsSnapshot | null>(null)

  useEffect(() => {
    let live = true
    const poll = async (): Promise<void> => {
      try {
        const response = await fetch('/api/dsh-dt-stats/snapshot', { cache: 'no-store' })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const data = await response.json() as StatsSnapshot
        if (live) setSnapshot(data)
      } catch {
        // Keep the last known snapshot; a transient failure is not fatal.
      }
    }
    void poll()
    const timer = setInterval(() => { void poll() }, POLL_MS)
    return () => {
      live = false
      clearInterval(timer)
    }
  }, [])

  const stats = snapshot

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
            <h2 style={{ fontSize: 18, margin: '6px 0 4px' }}>实时统计</h2>
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

        <div style={{ display: 'flex', gap: 10, margin: '16px 0' }}>
          <StatCard
            label="TPS"
            value={stats !== null ? stats.tps.toFixed(2) : '-'}
            hint={stats !== null ? `平均 ${stats.tpsAvg.toFixed(2)}` : undefined}
          />
          <StatCard
            label="上下文"
            value={stats !== null ? formatNumber(stats.context) : '-'}
            hint={stats !== null ? `窗口 ${stats.windowSeconds}s` : undefined}
          />
          <StatCard
            label="请求"
            value={stats !== null ? formatNumber(stats.requests) : '-'}
            hint="累计"
          />
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <StatCard label="输入 Tokens" value={stats !== null ? formatNumber(stats.inputTokens) : '-'} />
          <StatCard label="输出 Tokens" value={stats !== null ? formatNumber(stats.outputTokens) : '-'} />
          <StatCard label="缓存 Tokens" value={stats !== null ? formatNumber(stats.cacheTokens) : '-'} />
        </div>

        <div style={{ border: '1px solid #e4e5df', borderRadius: 9, padding: 12, marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: '#999', marginBottom: 6 }}>进程内存</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: '#777' }}>RSS</div>
              <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2, color: '#444' }}>
                {stats !== null ? formatMegabytes(stats.rss) : '-'}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: '#777' }}>堆内存</div>
              <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2, color: '#444' }}>
                {stats !== null ? `${formatMegabytes(stats.heapUsed)} / ${formatMegabytes(stats.heapTotal)}` : '-'}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1, border: '1px solid #e4e5df', borderRadius: 9, padding: 12 }}>
            <div style={{ fontSize: 10, color: '#999' }}>运行时长</div>
            <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4, color: '#444' }}>
              {stats !== null ? formatDuration(stats.elapsed) : '-'}
            </div>
          </div>
          <div style={{ flex: 1, border: '1px solid #e4e5df', borderRadius: 9, padding: 12 }}>
            <div style={{ fontSize: 10, color: '#999' }}>进程时长</div>
            <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4, color: '#444' }}>
              {stats !== null ? formatDuration(stats.uptime) : '-'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
