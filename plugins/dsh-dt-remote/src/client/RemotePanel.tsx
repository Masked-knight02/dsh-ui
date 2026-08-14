/**
 * The mobile pairing panel: fetches the host /api/dsh-dt-remote/pair route and
 * renders the real one-time token as a deterministic 21x21 QR-style grid, the
 * phone-side pair link for each LAN address, the expiry deadline, and a
 * refresh action that mints a fresh token. Pure presentation; data arrives
 * through the route.
 * @module @masked-knight02/dsh-client-ui-dt-remote/client/RemotePanel
 */

import { useCallback, useEffect, useState } from 'react'

/** The pairing payload mirrored from the host route. */
export interface PairPayload {
  ok: boolean
  token: string
  addresses: string[]
  port: number | null
  expiresAt: number
  ttlMs: number
}

/** Panel props. */
export interface RemotePanelProps {
  onClose: () => void
}

/** QR grid edge length in cells (441 = 21 x 21 cells total). */
export const QR_SIZE = 21

/** Cell size in pixels of the rendered grid. */
const CELL_PX = 9

/**
 * Derive the 21x21 QR-style cell matrix from the token: a deterministic
 * linear hash over the token characters (mirrors the preview app's
 * qr-grid generation in src/main.jsx). The same token always draws the same
 * pattern, so the phone scan target changes whenever the token is refreshed.
 * @param token - the pairing token.
 * @returns a flat QR_SIZE^2 boolean matrix (true = filled cell).
 */
export function qrCells(token: string): boolean[] {
  const cells: boolean[] = []
  let hash = 0
  for (let i = 0; i < QR_SIZE * QR_SIZE; i += 1) {
    hash = (hash * 31 + token.charCodeAt(i % token.length) + i) % 97
    cells.push(hash % 3 !== 0)
  }
  return cells
}

/** Build the phone-side pair link for one LAN address. */
export function pairLink(token: string, address: string, port: number | null): string {
  const authority = port === null ? address : `${address}:${String(port)}`
  return `http://${authority}/m?pair=${token}`
}

/** Format the expiry deadline as a local clock time (e.g. 10:32). */
function formatExpiry(expiresAt: number): string {
  return new Date(expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

/** Fetch a fresh pairing payload from the host route. */
async function fetchPair(): Promise<PairPayload> {
  const response = await fetch('/api/dsh-dt-remote/pair', { cache: 'no-store' })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return await response.json() as PairPayload
}

/** Render the mobile pairing panel. */
export function RemotePanel({ onClose }: RemotePanelProps): JSX.Element {
  const [payload, setPayload] = useState<PairPayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [address, setAddress] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const refresh = useCallback(async (): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchPair()
      setPayload(data)
      setAddress(current => current !== null && data.addresses.includes(current) ? current : (data.addresses[0] ?? null))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const token = payload?.token ?? ''
  const cells = qrCells(token)
  const port = payload?.port ?? null
  const selected = address ?? ''
  const link = token !== '' && selected !== '' ? pairLink(token, selected, port) : null

  const copyLink = (): void => {
    if (link === null) return
    navigator.clipboard?.writeText(link).catch(() => { /* clipboard may be unavailable; ignore */ })
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const badge = loading
    ? '获取中'
    : error !== null
      ? '获取失败'
      : '等待配对'

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
          maxHeight: '92vh',
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
            <div style={{ fontSize: 10, letterSpacing: '.1em', color: '#999' }}>MOBILE REMOTE</div>
            <h2 style={{ fontSize: 18, margin: '6px 0 4px' }}>移动端远程控制</h2>
            <p style={{ margin: 0, color: '#999b94', fontSize: 12 }}>扫码或在手机上打开链接，即可远程控制当前工作区</p>
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

        <div
          style={{
            border: '1px solid #e0e1dc',
            borderRadius: 11,
            padding: 14,
            margin: '18px 0 12px',
            background: '#fafaf7',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 12, color: '#5f625b' }}>手机扫码连接</span>
            <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 10, background: '#ecece7', color: '#8a8d85' }}>{badge}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${String(QR_SIZE)}, ${String(CELL_PX)}px)`,
                gap: 1,
                padding: 9,
                background: '#fff',
                border: '1px solid #e3e4df',
                borderRadius: 8,
              }}
              aria-hidden="true"
            >
              {cells.map((on, index) => (
                <span
                  key={index}
                  style={{
                    width: CELL_PX,
                    height: CELL_PX,
                    background: on ? '#26282b' : '#fff',
                  }}
                />
              ))}
            </div>
          </div>

          <p style={{ textAlign: 'center', color: '#a4a59f', fontSize: 10, margin: '8px 0 0' }}>
            {payload !== null ? `令牌将于 ${formatExpiry(payload.expiresAt)} 过期` : error !== null ? `获取失败：${error}` : '正在获取配对信息...'}
          </p>
        </div>

        <p style={{ color: '#999b94', fontSize: 12, margin: '0 0 6px' }}>无法扫码？可以在手机上打开链接</p>
        <p
          style={{ color: '#5b7396', fontSize: 11, wordBreak: 'break-all', margin: '0 0 14px' }}
          title={link ?? undefined}
        >
          {link ?? '-'}
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginBottom: 16 }}>
          <span style={{ color: '#999b94', fontSize: 11 }}>局域网地址</span>
          {(payload?.addresses ?? []).map(item => (
            <label key={item} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#5f625b', cursor: 'pointer' }}>
              <input
                type="radio"
                name="dsh-dt-remote-lan"
                checked={item === selected}
                onChange={() => setAddress(item)}
              />
              <code style={{ background: '#f0f1ec', borderRadius: 4, padding: '2px 6px', fontSize: 10, color: '#7d7f77' }}>{item}</code>
            </label>
          ))}
          {(payload?.addresses ?? []).length === 0 && (
            <span style={{ color: '#a4a59f', fontSize: 11 }}>未发现局域网地址</span>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => { void refresh() }}
            disabled={loading}
            style={{
              flex: 1,
              border: '1px solid #dddeda',
              background: '#f8f8f5',
              borderRadius: 8,
              padding: '9px 6px',
              color: '#5f625b',
              fontSize: 11,
              cursor: 'pointer',
            }}
          >
            刷新令牌
          </button>
          <button
            type="button"
            onClick={copyLink}
            disabled={link === null}
            style={{
              flex: 1,
              border: '1px solid #dddeda',
              background: '#f8f8f5',
              borderRadius: 8,
              padding: '9px 6px',
              color: '#5f625b',
              fontSize: 11,
              cursor: 'pointer',
            }}
          >
            {copied ? '已复制' : '复制链接'}
          </button>
        </div>
      </div>
    </div>
  )
}
