/**
 * The Git graph panel: fetches the host /api/dsh-dt-git/overview route for
 * the active workspace and renders the real branch list and commit history.
 * Pure presentation; data arrives through the route.
 * @module @masked-knight02/dsh-client-ui-dt-git/client/GitGraphPanel
 */

import { useEffect, useState } from 'react'

/** One graph commit row mirrored from the host route. */
export interface GitCommitRow {
  oid: string
  subject: string
  author: string
  time: string
  ref: string
}

/** The git overview payload mirrored from the host route. */
export interface GitOverview {
  ok: boolean
  workspace: string
  branch: string
  branches: string[]
  commits: GitCommitRow[]
}

/** Panel props. */
export interface GitGraphPanelProps {
  onClose: () => void
  /** Resolve the active workspace path at call time. */
  workspacePath: () => string | undefined
}

/** Render the live Git graph panel. */
export function GitGraphPanel({ onClose, workspacePath }: GitGraphPanelProps): JSX.Element {
  const [overview, setOverview] = useState<GitOverview | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let live = true
    const path = workspacePath()
    if (path === undefined) {
      setError('没有激活的工作区')
      return
    }
    fetch(`/api/dsh-dt-git/overview?path=${encodeURIComponent(path)}`, { cache: 'no-store' })
      .then(response => response.json() as Promise<GitOverview>)
      .then(data => {
        if (!live) return
        if (data.ok) setOverview(data)
        else setError('git 读取失败')
      })
      .catch((cause: unknown) => { if (live) setError(cause instanceof Error ? cause.message : String(cause)) })
    return () => { live = false }
  }, [workspacePath])

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
          width: 680,
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
            <h2 style={{ fontSize: 18, margin: '6px 0 4px' }}>Git 图谱</h2>
            <div style={{ fontSize: 11, color: '#999' }}>{overview?.workspace ?? '读取中...'}</div>
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

        {error !== null && <p style={{ color: '#b04a45', fontSize: 13 }}>{error}</p>}
        {overview === null && error === null && <p style={{ color: '#777', fontSize: 13 }}>读取中...</p>}
        {overview !== null && overview.branch === '' && overview.commits.length === 0 && (
          <p style={{ color: '#aaa', fontSize: 12 }}>该工作区不是 Git 仓库</p>
        )}
        {overview !== null && (overview.branch !== '' || overview.commits.length > 0) && (
          <>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '14px 0 10px' }}>
              {overview.branches.map(branch => (
                <span
                  key={branch}
                  style={{
                    fontSize: 11,
                    padding: '3px 9px',
                    borderRadius: 10,
                    background: branch === overview.branch ? '#dce8f8' : '#eceee9',
                    color: branch === overview.branch ? '#58739e' : '#7b8078',
                    fontWeight: branch === overview.branch ? 600 : 400,
                  }}
                >
                  {branch}
                </span>
              ))}
            </div>
            <div style={{ borderTop: '1px solid #eee' }}>
              {overview.commits.map(commit => (
                <div
                  key={commit.oid}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '64px 1fr',
                    gap: 10,
                    alignItems: 'baseline',
                    padding: '10px 4px',
                    borderBottom: '1px solid #f0f1ec',
                  }}
                >
                  <code style={{ fontSize: 10, color: '#9b9c95' }}>{commit.oid}</code>
                  <div>
                    <div style={{ fontSize: 12, color: '#575951' }}>{commit.subject}</div>
                    <div style={{ fontSize: 10, color: '#9a9b94', marginTop: 3 }}>
                      <span style={{ background: '#ebeee9', borderRadius: 4, padding: '1px 5px', marginRight: 6 }}>
                        {commit.ref}
                      </span>
                      {commit.author} · {commit.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
