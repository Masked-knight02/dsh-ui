/**
 * The SSH operations panel: host CRUD, connect test, and command exec over
 * the host /api/dsh-dt-ssh routes. Pure presentation; data arrives through
 * the routes.
 * @module @masked-knight02/dsh-client-ui-dt-ssh/client/SshPanel
 */

import { useEffect, useState } from 'react'

/** One SSH host row mirrored from the host store. */
export interface SshHost {
  alias: string
  host: string
  port: number
  user: string
  auth: 'key' | 'password'
  password?: string
  description?: string
}

/** Panel props. */
export interface SshPanelProps {
  onClose: () => void
}

/** Render the SSH operations panel. */
export function SshPanel({ onClose }: SshPanelProps): JSX.Element {
  const [hosts, setHosts] = useState<SshHost[]>([])
  const [form, setForm] = useState<SshHost>({ alias: '', host: '', port: 22, user: 'root', auth: 'key' })
  const [testing, setTesting] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<Record<string, { ok: boolean; latencyMs?: number; error?: string }>>({})
  const [execAlias, setExecAlias] = useState('')
  const [execCommand, setExecCommand] = useState('')
  const [execOutput, setExecOutput] = useState<string | null>(null)

  const load = (): void => {
    fetch('/api/dsh-dt-ssh/hosts', { cache: 'no-store' })
      .then(response => response.json())
      .then(data => { if (data.ok) setHosts(data.hosts as SshHost[]) })
      .catch(() => { /* transient */ })
  }

  useEffect(() => { load() }, [])

  const save = (): void => {
    if (form.alias.trim() === '' || form.host.trim() === '') return
    fetch('/api/dsh-dt-ssh/save', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(form),
    })
      .then(response => response.json())
      .then(data => { if (data.ok) { setHosts(data.hosts as SshHost[]); setForm({ alias: '', host: '', port: 22, user: 'root', auth: 'key' }) } })
      .catch(() => { /* transient */ })
  }

  const remove = (alias: string): void => {
    fetch('/api/dsh-dt-ssh/delete', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ alias }),
    })
      .then(response => response.json())
      .then(data => { if (data.ok) setHosts(data.hosts as SshHost[]) })
      .catch(() => { /* transient */ })
  }

  const test = (host: SshHost): void => {
    setTesting(host.alias)
    fetch('/api/dsh-dt-ssh/test', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(host),
    })
      .then(response => response.json())
      .then(data => {
        setTestResult(prev => ({ ...prev, [host.alias]: data }))
        setTesting(null)
      })
      .catch(() => { setTesting(null) })
  }

  const runExec = (): void => {
    const host = hosts.find(row => row.alias === execAlias)
    if (host === undefined || execCommand.trim() === '') return
    setExecOutput('执行中...')
    fetch('/api/dsh-dt-ssh/exec', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ host, command: execCommand }),
    })
      .then(response => response.json())
      .then(data => {
        if (data.ok) {
          setExecOutput(`${data.stdout}${data.stderr !== '' ? data.stderr : ''}exit code: ${String(data.code)}`)
        } else {
          setExecOutput(`失败：${data.error ?? 'unknown'}`)
        }
      })
      .catch((error: unknown) => { setExecOutput(`请求失败：${error instanceof Error ? error.message : String(error)}`) })
  }

  const inputStyle = { padding: '7px 9px', border: '1px solid #dddeda', borderRadius: 6, fontSize: 12, outline: 0 }
  const buttonStyle = { border: '1px solid #dddeda', background: '#f6f6f3', borderRadius: 6, padding: '6px 11px', fontSize: 11, cursor: 'pointer' }

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
          width: 720,
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
            <h2 style={{ fontSize: 18, margin: '6px 0 4px' }}>SSH 运维</h2>
            <div style={{ fontSize: 11, color: '#999' }}>配置存 ~/.dsh/dsh-dt-ssh.json · 真实 ssh2 连接</div>
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

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '14px 0' }}>
          <input style={{ ...inputStyle, width: 110 }} placeholder="别名" value={form.alias} onChange={e => setForm({ ...form, alias: e.target.value })} />
          <input style={{ ...inputStyle, width: 150 }} placeholder="主机地址" value={form.host} onChange={e => setForm({ ...form, host: e.target.value })} />
          <input style={{ ...inputStyle, width: 60 }} type="number" placeholder="端口" value={String(form.port)} onChange={e => setForm({ ...form, port: Number(e.target.value) || 22 })} />
          <input style={{ ...inputStyle, width: 90 }} placeholder="用户名" value={form.user} onChange={e => setForm({ ...form, user: e.target.value })} />
          <select
            style={inputStyle}
            value={form.auth}
            onChange={e => setForm({ ...form, auth: e.target.value as 'key' | 'password' })}
          >
            <option value="key">密钥</option>
            <option value="password">密码</option>
          </select>
          {form.auth === 'password' && (
            <input style={{ ...inputStyle, width: 110 }} type="password" placeholder="密码" value={form.password ?? ''} onChange={e => setForm({ ...form, password: e.target.value })} />
          )}
          <button style={{ ...buttonStyle, background: '#4a5c74', color: '#fff', borderColor: '#4a5c74' }} onClick={save}>
            保存主机
          </button>
        </div>

        {hosts.length === 0 && <p style={{ color: '#aaa', fontSize: 12, textAlign: 'center', padding: 10 }}>暂无主机</p>}
        {hosts.map(host => (
          <div key={host.alias} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 6px', borderBottom: '1px solid #f0f1ec' }}>
            <code style={{ fontSize: 11, color: '#4c6a8f', width: 120 }}>{host.alias}</code>
            <span style={{ fontSize: 11, color: '#666', flex: 1 }}>{host.user}@{host.host}:{host.port}</span>
            <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 9, background: host.auth === 'key' ? '#e3ebf4' : '#eceee9', color: host.auth === 'key' ? '#5c7392' : '#7b8078' }}>
              {host.auth === 'key' ? '密钥' : '密码'}
            </span>
            {testResult[host.alias]?.ok === true && (
              <span style={{ fontSize: 10, color: '#5d8a63' }}>{testResult[host.alias].latencyMs}ms</span>
            )}
            {testResult[host.alias]?.ok === false && (
              <span style={{ fontSize: 10, color: '#b04a45', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={testResult[host.alias].error}>
                {testResult[host.alias].error}
              </span>
            )}
            <button style={buttonStyle} disabled={testing === host.alias} onClick={() => test(host)}>
              {testing === host.alias ? '测试中...' : '测试连接'}
            </button>
            <button style={buttonStyle} onClick={() => remove(host.alias)}>删除</button>
          </div>
        ))}

        <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #e8e9e3' }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>远程命令执行</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <select style={{ ...inputStyle, width: 140 }} value={execAlias} onChange={e => setExecAlias(e.target.value)}>
              <option value="">选择主机</option>
              {hosts.map(host => <option key={host.alias} value={host.alias}>{host.alias}</option>)}
            </select>
            <input
              style={{ ...inputStyle, flex: 1 }}
              placeholder="如 uname -a"
              value={execCommand}
              onChange={e => setExecCommand(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') runExec() }}
            />
            <button style={{ ...buttonStyle, background: '#3c4a5e', color: '#fff', borderColor: '#3c4a5e' }} onClick={runExec}>执行</button>
          </div>
          {execOutput !== null && (
            <pre style={{ background: '#14161a', color: '#c6cad1', borderRadius: 8, padding: 12, fontSize: 11, marginTop: 8, overflow: 'auto', maxHeight: 180 }}>
              {execOutput}
            </pre>
          )}
        </div>
      </div>
    </div>
  )
}
