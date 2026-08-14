/**
 * The task board panel: polls the host /api/dsh-dt-board/overview route and
 * renders the real five-column kanban (backlog / todo / running / done /
 * failed) persisted by the host half. New tasks, column moves and deletes
 * write back through the /api/dsh-dt-board/tasks route. Pure presentation
 * with inline styles; data arrives through the routes.
 * @module @masked-knight02/dsh-client-ui-dt-board/client/TaskBoardPanel
 */

import { useCallback, useEffect, useState } from 'react'
import type { CSSProperties } from 'react'

/** A task column id, mirrored from the host half. */
export type TaskColumn = 'backlog' | 'todo' | 'running' | 'done' | 'failed'

/** One board task row, mirrored from the host half. */
export interface BoardTask {
  id: string
  title: string
  note: string
  column: TaskColumn
  createdAt: number
  updatedAt: number
}

/** One column slice of the overview payload, mirrored from the host half. */
export interface BoardColumnPayload {
  id: TaskColumn
  label: string
  tasks: BoardTask[]
}

/** The overview payload of the host /api/dsh-dt-board/overview route. */
export interface BoardOverview {
  ok: boolean
  updated: number
  columns: BoardColumnPayload[]
}

/** Panel props. */
export interface TaskBoardPanelProps {
  onClose: () => void
}

/** The fixed column metadata: display order, zh label, and accent color. */
const COLUMN_META: readonly { id: TaskColumn; label: string; color: string }[] = [
  { id: 'backlog', label: '待规划', color: '#9aa0a8' },
  { id: 'todo', label: '待办', color: '#5b78ae' },
  { id: 'running', label: '进行中', color: '#b98a4e' },
  { id: 'done', label: '已完成', color: '#5d8a63' },
  { id: 'failed', label: '已失败', color: '#b04a45' },
]

/** Poll interval in milliseconds. */
const POLL_MS = 1500

/** The new-task form draft. */
interface TaskDraft {
  title: string
  column: TaskColumn
}

/** Format a millisecond timestamp as a compact local date-time string. */
function formatTime(ms: number): string {
  if (ms <= 0) return '-'
  const date = new Date(ms)
  const pad = (value: number): string => String(value).padStart(2, '0')
  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** The result of one fetch action: whether it succeeded and the error text. */
interface ActionResult {
  ok: boolean
  error?: string
}

/** One task card with move (left/right) and delete actions. */
function TaskCard(props: {
  task: BoardTask
  canLeft: boolean
  canRight: boolean
  busy: boolean
  onMove: (task: BoardTask, column: TaskColumn) => void
  onRemove: (task: BoardTask) => void
}): JSX.Element {
  const { task, canLeft, canRight, busy, onMove, onRemove } = props
  const actionStyle: CSSProperties = {
    border: '1px solid #dcddd6',
    background: '#f4f4f1',
    color: '#666',
    borderRadius: 6,
    padding: '2px 8px',
    fontSize: 12,
    cursor: 'pointer',
    lineHeight: '18px',
  }
  const disabledStyle: CSSProperties = { ...actionStyle, opacity: 0.35, cursor: 'default' }
  return (
    <div style={{ background: '#fff', border: '1px solid #e4e5df', borderRadius: 9, padding: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#333', wordBreak: 'break-word' }}>{task.title}</div>
        <button
          type="button"
          disabled={busy}
          onClick={() => onRemove(task)}
          style={{
            border: 0,
            background: 'transparent',
            color: '#b04a45',
            cursor: 'pointer',
            fontSize: 14,
            lineHeight: '14px',
            padding: 0,
            opacity: busy ? 0.4 : 1,
          }}
          aria-label="删除任务"
        >
          ×
        </button>
      </div>
      {task.note !== '' && (
        <div style={{ fontSize: 12, color: '#888', marginTop: 4, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{task.note}</div>
      )}
      <div style={{ fontSize: 10, color: '#aaa', marginTop: 6 }}>创建于 {formatTime(task.createdAt)}</div>
      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        <button
          type="button"
          disabled={!canLeft || busy}
          onClick={() => onMove(task, COLUMN_META[COLUMN_META.findIndex(meta => meta.id === task.column) - 1].id)}
          style={canLeft && !busy ? actionStyle : disabledStyle}
          aria-label="移到上一列"
        >
          ←
        </button>
        <button
          type="button"
          disabled={!canRight || busy}
          onClick={() => onMove(task, COLUMN_META[COLUMN_META.findIndex(meta => meta.id === task.column) + 1].id)}
          style={canRight && !busy ? actionStyle : disabledStyle}
          aria-label="移到下一列"
        >
          →
        </button>
      </div>
    </div>
  )
}

/** Render the live five-column task board panel. */
export function TaskBoardPanel({ onClose }: TaskBoardPanelProps): JSX.Element {
  const [overview, setOverview] = useState<BoardOverview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [draft, setDraft] = useState<TaskDraft>({ title: '', column: 'backlog' })

  /** Re-fetch the board; a transient failure keeps the last known state. */
  const refresh = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch('/api/dsh-dt-board/overview', { cache: 'no-store' })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json() as BoardOverview
      setOverview(data)
    } catch {
      // Keep the last known board; a transient failure is not fatal.
    }
  }, [])

  useEffect(() => {
    void refresh()
    const timer = setInterval(() => { void refresh() }, POLL_MS)
    return () => { clearInterval(timer) }
  }, [refresh])

  /** Run one fetch action with busy/error bookkeeping; re-polls on success. */
  const runAction = async (run: () => Promise<ActionResult>): Promise<boolean> => {
    setBusy(true)
    setError(null)
    try {
      const result = await run()
      if (!result.ok) {
        setError(result.error ?? '操作失败')
        return false
      }
      await refresh()
      return true
    } catch {
      setError('操作失败，请稍后重试')
      return false
    } finally {
      setBusy(false)
    }
  }

  /** One same-origin JSON request against the board API. */
  const requestJson = async (url: string, init?: RequestInit): Promise<ActionResult> => {
    try {
      const response = await fetch(url, init)
      const payload = await response.json().catch(() => null) as { error?: string } | null
      return { ok: response.ok, error: response.ok ? undefined : (payload?.error ?? `HTTP ${response.status}`) }
    } catch {
      return { ok: false, error: '网络错误' }
    }
  }

  const createTask = async (): Promise<void> => {
    const title = draft.title.trim()
    if (title === '') return
    const ok = await runAction(() => requestJson('/api/dsh-dt-board/tasks', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title, column: draft.column }),
    }))
    if (ok) setDraft(prev => ({ ...prev, title: '' }))
  }

  const moveTask = (task: BoardTask, column: TaskColumn): void => {
    void runAction(() => requestJson('/api/dsh-dt-board/tasks', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: task.id, column }),
    }))
  }

  const removeTask = (task: BoardTask): void => {
    void runAction(() => requestJson(`/api/dsh-dt-board/tasks?id=${encodeURIComponent(task.id)}`, { method: 'DELETE' }))
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
          width: 1120,
          maxWidth: '96vw',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#fff',
          borderRadius: 12,
          padding: 20,
          boxShadow: '0 18px 44px rgba(0,0,0,.28)',
          fontFamily: 'system-ui, sans-serif',
        }}
        onClick={event => event.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: '.1em', color: '#999' }}>MY PLUGIN</div>
            <h2 style={{ fontSize: 18, margin: '6px 0 2px' }}>任务看板</h2>
            <div style={{ fontSize: 11, color: '#999' }}>
              backlog / todo / running / done / failed
              {overview !== null && (
                <span style={{ marginLeft: 10 }}>更新于 {overview.updated > 0 ? new Date(overview.updated).toLocaleTimeString() : '-'}</span>
              )}
            </div>
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

        {error !== null && (
          <div
            style={{
              background: '#fbeceb',
              color: '#b04a45',
              border: '1px solid #eecfcc',
              borderRadius: 8,
              padding: '8px 10px',
              fontSize: 12,
              marginTop: 12,
            }}
          >
            {error}
          </div>
        )}

        <form
          onSubmit={event => {
            event.preventDefault()
            void createTask()
          }}
          style={{ display: 'flex', gap: 8, marginTop: 14, marginBottom: 12 }}
        >
          <input
            value={draft.title}
            onChange={event => setDraft(prev => ({ ...prev, title: event.target.value }))}
            placeholder="新任务标题"
            disabled={busy}
            style={{
              flex: 1,
              border: '1px solid #dcddd6',
              borderRadius: 8,
              padding: '7px 10px',
              fontSize: 13,
              outline: 'none',
            }}
          />
          <select
            value={draft.column}
            onChange={event => setDraft(prev => ({ ...prev, column: event.target.value as TaskColumn }))}
            disabled={busy}
            style={{
              border: '1px solid #dcddd6',
              borderRadius: 8,
              padding: '6px 8px',
              fontSize: 13,
              background: '#fff',
              color: '#444',
            }}
          >
            {COLUMN_META.map(meta => (
              <option key={meta.id} value={meta.id}>{meta.label}</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={busy || draft.title.trim() === ''}
            style={{
              border: 0,
              borderRadius: 8,
              padding: '7px 14px',
              fontSize: 13,
              fontWeight: 600,
              background: '#5b78ae',
              color: '#fff',
              cursor: 'pointer',
              opacity: busy || draft.title.trim() === '' ? 0.5 : 1,
            }}
          >
            新建任务
          </button>
        </form>

        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            gap: 10,
            overflowX: 'auto',
            overflowY: 'auto',
            paddingBottom: 2,
          }}
        >
          {COLUMN_META.map(meta => {
            const column = overview?.columns.find(item => item.id === meta.id)
            const tasks = column?.tasks ?? []
            const index = COLUMN_META.findIndex(item => item.id === meta.id)
            return (
              <div
                key={meta.id}
                style={{
                  flex: '1 1 0',
                  minWidth: 200,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  background: '#f5f5f2',
                  borderRadius: 10,
                  padding: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 2px' }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: meta.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#3c3f3a' }}>{meta.label}</span>
                  <span
                    style={{
                      fontSize: 11,
                      color: '#999',
                      background: '#e9e9e4',
                      borderRadius: 9,
                      padding: '0 7px',
                      lineHeight: '16px',
                      marginLeft: 'auto',
                    }}
                  >
                    {tasks.length}
                  </span>
                </div>
                {tasks.length === 0 && (
                  <div style={{ fontSize: 12, color: '#b5b5ae', textAlign: 'center', padding: '18px 0' }}>暂无任务</div>
                )}
                {tasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    canLeft={index > 0}
                    canRight={index < COLUMN_META.length - 1}
                    busy={busy}
                    onMove={moveTask}
                    onRemove={removeTask}
                  />
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
