/**
 * The task-run panel: create a task (title + prompt), run it through dsh's
 * real session machinery (workspace connect, rename, session.prompt), and
 * show the running/settled history. Tasks persist in localStorage.
 * @module @masked-knight02/dsh-client-ui-dt-run/client/TaskRunPanel
 */

import { useState } from 'react'
import type { ISessions } from '@deepseek-ai/dsh-client-runtime/client'
import type { IWorkspaces } from '@deepseek-ai/dsh-client-runtime/client'
import { runTask, type RunEvent } from '../core/execution.ts'

/** localStorage key for the task history. */
const STORAGE_KEY = 'dsh.dtRun.v1'

/** One task in the panel history. */
export interface RunTask {
  id: string
  title: string
  prompt: string
  status: 'todo' | 'running' | 'done' | 'failed'
  sessionId: string | undefined
  error: string | undefined
  createdAt: number
  updatedAt: number
}

/** Panel props. */
export interface TaskRunPanelProps {
  onClose: () => void
  sessions: ISessions
  workspaces: IWorkspaces
}

/** Load the persisted task list. */
function loadTasks(): RunTask[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? parsed as RunTask[] : []
  } catch {
    return []
  }
}

/** Render the task-run panel. */
export function TaskRunPanel({ onClose, sessions, workspaces }: TaskRunPanelProps): JSX.Element {
  const [tasks, setTasks] = useState<RunTask[]>(loadTasks)
  const [title, setTitle] = useState('')
  const [prompt, setPrompt] = useState('')

  const persist = (next: RunTask[]): void => {
    setTasks(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  const patch = (id: string, change: Partial<RunTask>): void => {
    persist(tasks.map(task => task.id === id ? { ...task, ...change, updatedAt: Date.now() } : task))
  }

  const submit = (event: React.FormEvent): void => {
    event.preventDefault()
    const trimmed = title.trim()
    if (trimmed === '' || tasks.some(task => task.status === 'running')) return
    const task: RunTask = {
      id: String(Date.now()),
      title: trimmed,
      prompt: prompt.trim(),
      status: 'todo',
      sessionId: undefined,
      error: undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    persist([task, ...tasks])
    setTitle('')
    setPrompt('')
    void execute(task)
  }

  const execute = async (task: RunTask): Promise<void> => {
    patch(task.id, { status: 'running' })
    const env = {
      sessions: { binding: (id: string) => sessions.binding(id as never) },
      workspaces: {
        list: workspaces.list,
        connectWorkspace: (id: string) => workspaces.connectWorkspace(id as never),
      },
    }
    await runTask(env, task.id, task.title, task.prompt, (event: RunEvent) => {
      if (event.kind === 'started') {
        patch(task.id, { sessionId: event.sessionId })
      } else {
        patch(task.id, {
          status: event.outcome === 'succeeded' ? 'done' : 'failed',
          error: event.error,
        })
      }
    })
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
          width: 560,
          maxWidth: '94vw',
          maxHeight: '88vh',
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
            <div style={{ fontSize: 10, letterSpacing: '.1em', color: '#999' }}>MY PLUGIN</div>
            <h2 style={{ fontSize: 18, margin: '6px 0 4px' }}>任务执行</h2>
            <div style={{ fontSize: 11, color: '#999' }}>真实 session.prompt 执行，消耗 API 额度</div>
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

        <form
          onSubmit={submit}
          style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '14px 0' }}
        >
          <input
            value={title}
            onChange={event => setTitle(event.target.value)}
            placeholder="任务标题（同时用作会话名）"
            style={{ padding: '8px 10px', border: '1px solid #dddeda', borderRadius: 7, fontSize: 13, outline: 0 }}
          />
          <textarea
            value={prompt}
            onChange={event => setPrompt(event.target.value)}
            placeholder="执行 Prompt（留空则使用标题）"
            rows={2}
            style={{ padding: '8px 10px', border: '1px solid #dddeda', borderRadius: 7, fontSize: 13, outline: 0, resize: 'vertical' }}
          />
          <button
            type="submit"
            disabled={tasks.some(task => task.status === 'running')}
            style={{
              padding: '9px',
              border: 0,
              borderRadius: 7,
              background: tasks.some(task => task.status === 'running') ? '#c9cdc6' : '#4a5c74',
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              cursor: tasks.some(task => task.status === 'running') ? 'not-allowed' : 'pointer',
            }}
          >
            {tasks.some(task => task.status === 'running') ? '执行中...' : '执行任务'}
          </button>
        </form>

        {tasks.length === 0 && <p style={{ color: '#aaa', fontSize: 12, textAlign: 'center', padding: 14 }}>暂无任务</p>}
        {tasks.map(task => (
          <div
            key={task.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 8px',
              borderBottom: '1px solid #f0f1ec',
            }}
          >
            <span
              style={{
                width: 9,
                height: 9,
                borderRadius: '50%',
                flex: 'none',
                background: task.status === 'running' ? '#5b78ae'
                  : task.status === 'done' ? '#5d8a63'
                    : task.status === 'failed' ? '#b04a45' : '#9aa0a8',
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: '#3c3f3a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {task.title}
              </div>
              <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>
                {task.status === 'done' && '已完成'}
                {task.status === 'failed' && (task.error ?? '已失败')}
                {task.status === 'running' && '正在执行...'}
                {task.status === 'todo' && '待执行'}
                {task.sessionId !== undefined && ` · ${task.sessionId.slice(0, 8)}`}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
