/**
 * The taozhe pet widget: a floating animated pet that polls the host
 * /api/dsh-dt-pet/status route and cycles the matching animation frames.
 * Pure presentation; frame PNGs are served by /api/dsh-dt-pet/frame.
 * @module @masked-knight02/dsh-client-ui-dt-pet/client/TaozhePet
 */

import { useEffect, useState } from 'react'

/** The shared pet state protocol. */
type PetMode = 'idle' | 'thinking' | 'working' | 'success' | 'error' | 'waiting'

/** A pet status snapshot mirrored from the host route. */
interface PetStatus {
  mode: PetMode
  message: string
  updated: number
}

/** Pet state mode -> animation mode (mirrors pets/taozhe/pet.json stateMap). */
const STATE_MAP: Record<PetMode, string> = {
  idle: 'idle',
  thinking: 'waiting',
  working: 'running',
  success: 'review',
  error: 'failed',
  waiting: 'waiting',
}

/** Frame count per animation mode (mirrors pets/taozhe/pet.json frames). */
const FRAME_COUNT: Record<string, number> = {
  idle: 6,
  waiting: 6,
  running: 6,
  review: 6,
  failed: 8,
  waving: 4,
  jumping: 5,
}

/** Chinese labels per pet state mode. */
const MODE_LABEL: Record<PetMode, string> = {
  idle: '空闲',
  thinking: '思考中',
  working: '工作中',
  success: '成功',
  error: '出错',
  waiting: '等待',
}

const POLL_MS = 700
const FRAME_MS = 150

/** Render the floating taozhe pet. */
export function TaozhePet(): JSX.Element {
  const [status, setStatus] = useState<PetStatus>({ mode: 'idle', message: '', updated: 0 })
  const [frame, setFrame] = useState(0)
  const [show, setShow] = useState(true)

  useEffect(() => {
    let live = true
    const poll = async (): Promise<void> => {
      try {
        const response = await fetch('/api/dsh-dt-pet/status', { cache: 'no-store' })
        if (!response.ok) return
        const data = await response.json() as { mode?: PetMode; message?: string; updated?: number }
        if (live) setStatus({ mode: data.mode ?? 'idle', message: data.message ?? '', updated: data.updated ?? 0 })
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

  const anim = STATE_MAP[status.mode] ?? 'idle'
  const count = FRAME_COUNT[anim] ?? 6

  useEffect(() => {
    const timer = setInterval(() => setFrame(value => (value + 1) % count), FRAME_MS)
    return () => clearInterval(timer)
  }, [count])

  if (!show) {
    return (
      <button
        type="button"
        onClick={() => setShow(true)}
        style={{
          position: 'fixed',
          right: 22,
          bottom: 58,
          zIndex: 9990,
          width: 36,
          height: 36,
          border: 0,
          borderRadius: '50%',
          background: '#292929',
          color: '#fff',
          cursor: 'pointer',
          boxShadow: '0 6px 20px rgba(0,0,0,.2)',
          fontSize: 18,
        }}
        aria-label="打开桌宠"
      >
        *
      </button>
    )
  }

  const n = String(frame).padStart(2, '0')

  return (
    <div style={{ position: 'fixed', right: 24, bottom: 58, zIndex: 9990, width: 138, height: 155, pointerEvents: 'none' }}>
      <button
        type="button"
        onClick={() => setShow(false)}
        style={{
          pointerEvents: 'auto',
          position: 'absolute',
          right: -2,
          top: -8,
          width: 18,
          height: 18,
          border: 0,
          borderRadius: '50%',
          background: '#fff',
          color: '#ae8ca5',
          fontSize: 14,
          lineHeight: '15px',
          cursor: 'pointer',
          opacity: 0,
          transition: '.2s',
        }}
        aria-label="关闭桌宠"
      >
        ×
      </button>
      <img
        src={`/api/dsh-dt-pet/frame?mode=${anim}&n=${n}`}
        alt="taozhe"
        style={{ position: 'absolute', bottom: 0, left: 5, width: 118, height: 'auto', filter: 'drop-shadow(0 10px 8px rgba(91,53,80,.13))' }}
      />
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          zIndex: 2,
          maxWidth: 140,
          padding: '8px 11px',
          border: '1px solid #e3bfdc',
          borderRadius: '12px 12px 3px 12px',
          background: '#fff',
          color: '#8d6280',
          fontSize: 12,
          fontWeight: 500,
          boxShadow: '0 6px 16px rgba(92,49,93,.16)',
          whiteSpace: 'nowrap',
        }}
      >
        {status.message !== '' ? status.message : MODE_LABEL[status.mode]}
      </div>
    </div>
  )
}
