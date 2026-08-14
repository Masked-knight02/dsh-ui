/**
 * The file panel: three tabs - Files (the host file tree, drill into
 * subdirectories), Changes (git status rows) and Preview (content of the
 * selected file). Pure presentation; data arrives through the host
 * /api/dsh-dt-panel/files, /api/dsh-dt-panel/changes and
 * /api/dsh-dt-panel/file routes.
 * @module @masked-knight02/dsh-client-ui-dt-panel/client/PanelView
 */

import { useEffect, useState } from 'react'

/** One file-tree row mirrored from the host route. */
export interface FileEntry {
  name: string
  dir: boolean
  path: string
}

/** The file-tree payload mirrored from the host route. */
export interface FilesPayload {
  ok: boolean
  root: string
  depth: number
  entries: FileEntry[]
  truncated: boolean
}

/** One git change row mirrored from the host route. */
export interface ChangeEntry {
  index: string
  worktree: string
  path: string
  kind: string
}

/** The changes payload mirrored from the host route. */
export interface ChangesPayload {
  ok: boolean
  changes: ChangeEntry[]
  error?: string
}

/** The single-file content payload mirrored from the host route. */
export interface FilePayload {
  ok: boolean
  path: string
  size: number
  binary: boolean
  tooLarge: boolean
  text: string
}

/** Panel props. */
export interface PanelViewProps {
  onClose: () => void
}

/** The three panel tabs. */
type Tab = 'files' | 'changes' | 'preview'

/** Tab labels (zh is the source language). */
const TAB_LABEL: Record<Tab, string> = {
  files: '文件',
  changes: '变更',
  preview: '预览',
}

/** The change-kind label dictionary. */
const KIND_LABEL: Record<string, string> = {
  added: '新增',
  modified: '修改',
  deleted: '删除',
  renamed: '重命名',
  copied: '复制',
  typechange: '类型变更',
  unmerged: '冲突',
  untracked: '未跟踪',
  ignored: '忽略',
  changed: '变更',
}

/** The change-kind badge color dictionary. */
const KIND_COLOR: Record<string, string> = {
  added: '#5d8a63',
  modified: '#5b78ae',
  deleted: '#b04a45',
  renamed: '#8a7bb5',
  copied: '#6d8f9e',
  typechange: '#b98a4e',
  unmerged: '#c2573f',
  untracked: '#9aa0a8',
  ignored: '#b8bcc2',
  changed: '#777777',
}

/** Fetch one JSON envelope from a host route. */
async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return await response.json() as T
}

/** The file a change row points at (rename rows carry `old -> new`). */
function previewPath(change: ChangeEntry): string {
  return change.path.split(' -> ').pop() ?? change.path
}

/** Format a byte count in a compact human form. */
function formatSize(size: number): string {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

/** Render the three-tab file panel. */
export function PanelView({ onClose }: PanelViewProps): JSX.Element {
  const [tab, setTab] = useState<Tab>('files')
  const [dirs, setDirs] = useState<string[]>([])
  const [entries, setEntries] = useState<FileEntry[]>([])
  const [filesTruncated, setFilesTruncated] = useState(false)
  const [filesError, setFilesError] = useState<string | null>(null)
  const [changes, setChanges] = useState<ChangeEntry[]>([])
  const [changesError, setChangesError] = useState<string | null>(null)
  const [changesTick, setChangesTick] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [preview, setPreview] = useState<FilePayload | null>(null)
  const [previewError, setPreviewError] = useState(false)

  /** Load the file tree for the current directory stack. */
  useEffect(() => {
    let live = true
    const rel = dirs.join('/')
    const query = rel === '' ? 'depth=1' : `path=${encodeURIComponent(rel)}&depth=1`
    setFilesError(null)
    void fetchJson<FilesPayload>(`/api/dsh-dt-panel/files?${query}`)
      .then(data => {
        if (!live) return
        setEntries(data.entries)
        setFilesTruncated(data.truncated)
      })
      .catch(() => {
        if (live) setFilesError('无法加载文件列表')
      })
    return () => { live = false }
  }, [dirs])

  /** Load the git change list on mount and on refresh. */
  useEffect(() => {
    let live = true
    setChangesError(null)
    void fetchJson<ChangesPayload>('/api/dsh-dt-panel/changes')
      .then(data => {
        if (!live) return
        setChanges(data.changes)
        if (!data.ok) setChangesError(data.error ?? 'git status 失败')
      })
      .catch(() => {
        if (live) setChangesError('无法加载 git 变更')
      })
    return () => { live = false }
  }, [changesTick])

  /** Load the preview content for the selected file. */
  useEffect(() => {
    if (selected === null) {
      setPreview(null)
      setPreviewError(false)
      return
    }
    let live = true
    setPreviewError(false)
    void fetchJson<FilePayload>(`/api/dsh-dt-panel/file?path=${encodeURIComponent(selected)}`)
      .then(data => {
        if (!live) return
        if (data.ok) setPreview(data)
        else setPreviewError(true)
      })
      .catch(() => {
        if (live) setPreviewError(true)
      })
    return () => { live = false }
  }, [selected])

  const openFile = (path: string): void => {
    setSelected(path)
    setTab('preview')
  }

  const openDir = (name: string): void => {
    setDirs(prev => [...prev, name])
  }

  const goUp = (): void => {
    setDirs(prev => prev.slice(0, -1))
  }

  const currentRel = dirs.join('/')

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
          width: 760,
          maxWidth: '94vw',
          height: 520,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 18px 44px rgba(0,0,0,.28)',
          fontFamily: 'system-ui, sans-serif',
          overflow: 'hidden',
        }}
        onClick={event => event.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '18px 20px 10px' }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: '.1em', color: '#999' }}>FILE PANEL</div>
            <h2 style={{ fontSize: 18, margin: '6px 0 0' }}>文件面板</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ border: 0, background: 'transparent', color: '#999', cursor: 'pointer', fontSize: 16, padding: 4 }}
            aria-label="关闭"
          >
            ×
          </button>
        </div>

        <div style={{ display: 'flex', gap: 4, padding: '0 20px', borderBottom: '1px solid #ecece6' }}>
          {(['files', 'changes', 'preview'] as const).map(name => (
            <button
              key={name}
              type="button"
              onClick={() => setTab(name)}
              style={{
                border: 0,
                background: 'transparent',
                padding: '8px 14px',
                cursor: 'pointer',
                fontSize: 13,
                color: tab === name ? '#3c3f3a' : '#8a8e87',
                fontWeight: tab === name ? 600 : 400,
                borderBottom: tab === name ? '2px solid #3c3f3a' : '2px solid transparent',
              }}
            >
              {TAB_LABEL[name]}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {tab === 'files' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderBottom: '1px solid #f0f0ea' }}>
                <button
                  type="button"
                  onClick={goUp}
                  disabled={dirs.length === 0}
                  style={{
                    border: '1px solid #e0e0d8',
                    background: dirs.length === 0 ? '#f6f6f2' : '#fff',
                    borderRadius: 6,
                    padding: '3px 10px',
                    fontSize: 12,
                    cursor: dirs.length === 0 ? 'default' : 'pointer',
                    color: dirs.length === 0 ? '#c0c0b8' : '#3c3f3a',
                  }}
                >
                  ← 返回上级
                </button>
                <code style={{ fontSize: 11, color: '#999', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {currentRel === '' ? '（工作目录）' : currentRel}
                </code>
              </div>
              <div style={{ flex: 1, overflow: 'auto', padding: '8px 10px' }}>
                {filesError !== null ? (
                  <div style={{ padding: 14, fontSize: 13, color: '#b04a45' }}>{filesError}</div>
                ) : entries.length === 0 ? (
                  <div style={{ padding: 14, fontSize: 13, color: '#999' }}>空目录</div>
                ) : (
                  entries.map(entry => (
                    <button
                      key={entry.path}
                      type="button"
                      onClick={() => { if (entry.dir) openDir(entry.name); else openFile(entry.path) }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        width: '100%',
                        border: 0,
                        background: 'transparent',
                        padding: '6px 10px',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 13,
                        color: '#3c3f3a',
                        textAlign: 'left',
                      }}
                      onMouseEnter={event => { event.currentTarget.style.background = '#f4f4ef' }}
                      onMouseLeave={event => { event.currentTarget.style.background = 'transparent' }}
                    >
                      <span style={{ color: entry.dir ? '#b98a4e' : '#9aa0a8', fontSize: 12 }}>
                        {entry.dir ? '▸' : '·'}
                      </span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.name}</span>
                      <span style={{ marginLeft: 'auto', fontSize: 10, color: '#b8bcc2' }}>
                        {entry.dir ? '目录' : '文件'}
                      </span>
                    </button>
                  ))
                )}
                {filesTruncated && (
                  <div style={{ padding: '8px 10px 4px', fontSize: 11, color: '#b98a4e' }}>
                    条目已达上限，列表已截断
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'changes' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderBottom: '1px solid #f0f0ea' }}>
                <span style={{ fontSize: 12, color: '#8a8e87' }}>git status --porcelain</span>
                <button
                  type="button"
                  onClick={() => setChangesTick(tick => tick + 1)}
                  style={{
                    marginLeft: 'auto',
                    border: '1px solid #e0e0d8',
                    background: '#fff',
                    borderRadius: 6,
                    padding: '3px 10px',
                    fontSize: 12,
                    cursor: 'pointer',
                    color: '#3c3f3a',
                  }}
                >
                  刷新
                </button>
              </div>
              <div style={{ flex: 1, overflow: 'auto', padding: '8px 10px' }}>
                {changesError !== null ? (
                  <div style={{ padding: 14, fontSize: 13, color: '#b04a45' }}>{changesError}</div>
                ) : changes.length === 0 ? (
                  <div style={{ padding: 14, fontSize: 13, color: '#999' }}>工作区干净，没有变更</div>
                ) : (
                  changes.map((change, index) => (
                    <button
                      key={`${change.path}-${index}`}
                      type="button"
                      onClick={() => openFile(previewPath(change))}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        width: '100%',
                        border: 0,
                        background: 'transparent',
                        padding: '6px 10px',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 13,
                        color: '#3c3f3a',
                        textAlign: 'left',
                      }}
                      onMouseEnter={event => { event.currentTarget.style.background = '#f4f4ef' }}
                      onMouseLeave={event => { event.currentTarget.style.background = 'transparent' }}
                    >
                      <span
                        style={{
                          flexShrink: 0,
                          fontSize: 10,
                          padding: '2px 7px',
                          borderRadius: 9,
                          color: '#fff',
                          background: KIND_COLOR[change.kind] ?? '#777777',
                        }}
                      >
                        {KIND_LABEL[change.kind] ?? change.kind}
                      </span>
                      <code style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12 }}>
                        {change.path}
                      </code>
                      <span style={{ marginLeft: 'auto', flexShrink: 0, fontSize: 10, color: '#b8bcc2' }}>
                        {change.index}{change.worktree}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {tab === 'preview' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {selected === null ? (
                <div style={{ padding: 24, fontSize: 13, color: '#999' }}>
                  在「文件」或「变更」中选择一个文件查看内容
                </div>
              ) : previewError ? (
                <div style={{ padding: 24, fontSize: 13, color: '#b04a45' }}>无法读取该文件（可能已删除或不可读）</div>
              ) : preview === null ? (
                <div style={{ padding: 24, fontSize: 13, color: '#999' }}>加载中…</div>
              ) : preview.binary ? (
                <div style={{ padding: 24, fontSize: 13, color: '#999' }}>二进制文件，不支持预览</div>
              ) : preview.tooLarge ? (
                <div style={{ padding: 24, fontSize: 13, color: '#b98a4e' }}>
                  文件过大（{formatSize(preview.size)}），仅支持预览 256 KB 以内的文本
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderBottom: '1px solid #f0f0ea' }}>
                    <code style={{ fontSize: 12, color: '#3c3f3a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {preview.path}
                    </code>
                    <span style={{ marginLeft: 'auto', flexShrink: 0, fontSize: 10, color: '#b8bcc2' }}>{formatSize(preview.size)}</span>
                  </div>
                  <pre
                    style={{
                      flex: 1,
                      margin: 0,
                      padding: 14,
                      overflow: 'auto',
                      fontSize: 12,
                      lineHeight: 1.6,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                      color: '#3c3f3a',
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                    }}
                  >
                    {preview.text === '' ? '（空文件）' : preview.text}
                  </pre>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
