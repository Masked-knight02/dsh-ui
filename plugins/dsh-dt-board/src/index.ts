/**
 * @masked-knight02/dsh-client-ui-dt-board - host half: a real task board
 * backend. A five-column kanban ledger (backlog / todo / running / done /
 * failed) persisted to ~/.dsh/dsh-dt-board.json, exposed through the
 * /api/dsh-dt-board/overview read route and the /api/dsh-dt-board/tasks CRUD
 * route (POST create / PATCH update / DELETE remove). The browser half
 * renders the sidebar entry and the board panel from these routes.
 *
 * @module @masked-knight02/dsh-client-ui-dt-board
 */

import { randomUUID } from 'node:crypto'
import { readFile, rename, writeFile, mkdir } from 'node:fs/promises'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { homedir } from 'node:os'
import { dirname, resolve } from 'node:path'
import type { Context } from '@deepseek-ai/cordis'
import type { WebRoute } from '@deepseek-ai/dsh-host-webserver'
import type {} from '@deepseek-ai/dsh-host-webserver'

/** Required services: the route registry. */
export const inject = ['webServer']

/** The fixed task board columns, in display order. */
export const BOARD_COLUMNS = ['backlog', 'todo', 'running', 'done', 'failed'] as const

/** One task board column id. */
export type TaskColumn = (typeof BOARD_COLUMNS)[number]

/** The fixed column definitions with UI labels (zh is the copy source). */
export const BOARD_COLUMN_DEFS: readonly { id: TaskColumn; label: string }[] = [
  { id: 'backlog', label: '待规划' },
  { id: 'todo', label: '待办' },
  { id: 'running', label: '进行中' },
  { id: 'done', label: '已完成' },
  { id: 'failed', label: '已失败' },
]

/** One board task row. */
export interface BoardTask {
  id: string
  title: string
  note: string
  column: TaskColumn
  createdAt: number
  updatedAt: number
}

/** One column slice of the overview payload. */
export interface BoardColumnPayload {
  id: TaskColumn
  label: string
  tasks: BoardTask[]
}

/** The JSON envelope of the overview route. */
export interface BoardOverviewPayload {
  ok: boolean
  updated: number
  columns: BoardColumnPayload[]
}

/** The persisted document shape (versioned for future migrations). */
interface BoardDocument {
  version: 1
  tasks: BoardTask[]
}

/** Browser-facing base path of the board API. */
export const BOARD_API = {
  overview: '/api/dsh-dt-board/overview',
  tasks: '/api/dsh-dt-board/tasks',
} as const

/** Cap on JSON request bodies (task rows are small). */
const MAX_JSON_BODY_BYTES = 64 * 1024

/** The persisted ledger path: ~/.dsh/dsh-dt-board.json. */
function boardFilePath(): string {
  return resolve(homedir(), '.dsh', 'dsh-dt-board.json')
}

/** An empty ledger document. */
function emptyBoardDocument(): BoardDocument {
  return { version: 1, tasks: [] }
}

/** Narrow an unknown value to a task column id. */
function isTaskColumn(value: unknown): value is TaskColumn {
  return typeof value === 'string' && (BOARD_COLUMNS as readonly string[]).includes(value)
}

/** Validate one unknown row against the task shape; invalid rows are dropped on load. */
function isValidTask(value: unknown): value is BoardTask {
  if (typeof value !== 'object' || value === null) return false
  const task = value as Record<string, unknown>
  return typeof task.id === 'string' && task.id !== ''
    && typeof task.title === 'string' && task.title !== ''
    && typeof task.note === 'string'
    && isTaskColumn(task.column)
    && typeof task.createdAt === 'number'
    && typeof task.updatedAt === 'number'
}

/** Parse + validate a persisted ledger document; malformed rows are dropped. */
function parseBoardDocument(raw: string): BoardDocument {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return emptyBoardDocument()
  }
  if (typeof parsed !== 'object' || parsed === null) return emptyBoardDocument()
  const tasks = Array.isArray((parsed as { tasks?: unknown }).tasks)
    ? (parsed as { tasks: unknown[] }).tasks.filter(isValidTask)
    : []
  return { version: 1, tasks }
}

/**
 * The in-memory board store: lazily loads the ledger once, keeps every
 * mutation live in memory and persists each one atomically (tmp + rename)
 * through a serialized write chain. A failed write only skips persistence;
 * the in-memory state stays live.
 */
class BoardStore {
  private readonly file: string
  private state: BoardDocument | null = null
  private loadPromise: Promise<BoardDocument> | null = null
  private writeChain: Promise<void> = Promise.resolve()

  constructor(file: string) {
    this.file = file
  }

  /** Load (and cache) the ledger; a missing or corrupt file starts empty. */
  private async load(): Promise<BoardDocument> {
    if (this.state !== null) return this.state
    this.loadPromise ??= this.readFromDisk()
    const doc = await this.loadPromise
    this.state = doc
    return doc
  }

  private async readFromDisk(): Promise<BoardDocument> {
    try {
      return parseBoardDocument(await readFile(this.file, 'utf8'))
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.error('[dsh-dt-board] failed to read board file, starting empty', error)
      }
      return emptyBoardDocument()
    }
  }

  /** The full board grouped by column, oldest tasks first per column. */
  async overview(): Promise<BoardOverviewPayload> {
    const doc = await this.load()
    const tasks = [...doc.tasks].sort((a, b) => a.createdAt - b.createdAt)
    return {
      ok: true,
      updated: Date.now(),
      columns: BOARD_COLUMN_DEFS.map(def => ({
        id: def.id,
        label: def.label,
        tasks: tasks.filter(task => task.column === def.id),
      })),
    }
  }

  /** Create a task row and persist the ledger. */
  async create(input: { title: string; note: string; column: TaskColumn }): Promise<BoardTask> {
    const doc = await this.load()
    const now = Date.now()
    const task: BoardTask = {
      id: randomUUID(),
      title: input.title,
      note: input.note,
      column: input.column,
      createdAt: now,
      updatedAt: now,
    }
    doc.tasks.push(task)
    await this.persist()
    return task
  }

  /** Patch a task row (title / note / column) and persist the ledger. */
  async update(
    id: string,
    patch: { title?: string; note?: string; column?: TaskColumn },
  ): Promise<BoardTask> {
    const doc = await this.load()
    const task = doc.tasks.find(row => row.id === id)
    if (task === undefined) throw new Error('task-not-found')
    if (patch.title !== undefined) task.title = patch.title
    if (patch.note !== undefined) task.note = patch.note
    if (patch.column !== undefined) task.column = patch.column
    task.updatedAt = Date.now()
    await this.persist()
    return task
  }

  /** Remove a task row; resolves false when the id is unknown. */
  async remove(id: string): Promise<boolean> {
    const doc = await this.load()
    const index = doc.tasks.findIndex(row => row.id === id)
    if (index < 0) return false
    doc.tasks.splice(index, 1)
    await this.persist()
    return true
  }

  /** Queue one atomic write; failures are logged and never reject the chain. */
  private persist(): Promise<void> {
    const doc = this.state
    if (doc === null) return Promise.resolve()
    this.writeChain = this.writeChain
      .then(
        () => this.writeToDisk(doc),
        () => this.writeToDisk(doc),
      )
      .catch((error: unknown) => {
        console.error('[dsh-dt-board] failed to persist board file; in-memory state stays live', error)
      })
    return this.writeChain
  }

  /** Write the ledger atomically: tmp file in the same directory, then rename. */
  private async writeToDisk(doc: BoardDocument): Promise<void> {
    await mkdir(dirname(this.file), { recursive: true })
    const tmp = `${this.file}.tmp`
    await writeFile(tmp, JSON.stringify(doc, null, 2), 'utf8')
    await rename(tmp, this.file)
  }
}

/** Write one JSON response. */
function writeJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(body))
}

/** Require the method or answer 405. */
function requireMethod(req: IncomingMessage, res: ServerResponse, method: string): boolean {
  if (req.method === method) return true
  writeJson(res, 405, { ok: false, error: 'method-not-allowed' })
  return false
}

/** The human-readable message of an unknown error. */
function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/** Read a JSON request body (bounded; undefined when too large or unparseable). */
async function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown> | undefined> {
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of req) {
    const buffer = chunk as Buffer
    size += buffer.length
    if (size > MAX_JSON_BODY_BYTES) return undefined
    chunks.push(buffer)
  }
  try {
    const parsed: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'))
    return typeof parsed === 'object' && parsed !== null ? parsed as Record<string, unknown> : undefined
  } catch {
    return undefined
  }
}

/** Build the full /api/dsh-dt-board route family for one store. */
function makeBoardRoutes(store: BoardStore): WebRoute[] {
  return [
    {
      kind: 'exact',
      path: BOARD_API.overview,
      handler: async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
        if (!requireMethod(req, res, 'GET')) return
        try {
          writeJson(res, 200, await store.overview())
        } catch (error) {
          writeJson(res, 500, { ok: false, error: errorMessage(error) })
        }
      },
    },
    {
      kind: 'exact',
      path: BOARD_API.tasks,
      handler: async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
        const method = req.method ?? 'GET'
        if (method === 'POST') {
          // Create: { title, note?, column? }
          const body = await readJsonBody(req)
          const title = typeof body?.title === 'string' ? body.title.trim() : ''
          if (title === '') {
            writeJson(res, 400, { ok: false, error: 'invalid-title' })
            return
          }
          const note = typeof body?.note === 'string' ? body.note : ''
          const column = body?.column === undefined ? 'backlog' : body.column
          if (!isTaskColumn(column)) {
            writeJson(res, 400, { ok: false, error: 'invalid-column' })
            return
          }
          try {
            const task = await store.create({ title, note, column })
            writeJson(res, 200, { ok: true, task })
          } catch (error) {
            writeJson(res, 400, { ok: false, error: errorMessage(error) })
          }
          return
        }
        if (method === 'PATCH') {
          // Update: { id, title?, note?, column? }
          const body = await readJsonBody(req)
          const id = typeof body?.id === 'string' ? body.id : ''
          if (id === '') {
            writeJson(res, 400, { ok: false, error: 'invalid-id' })
            return
          }
          const title = body?.title === undefined ? undefined : (typeof body.title === 'string' ? body.title.trim() : '')
          if (title !== undefined && title === '') {
            writeJson(res, 400, { ok: false, error: 'invalid-title' })
            return
          }
          const note = body?.note === undefined ? undefined : (typeof body.note === 'string' ? body.note : '')
          const column = body?.column === undefined ? undefined : body.column
          if (column !== undefined && !isTaskColumn(column)) {
            writeJson(res, 400, { ok: false, error: 'invalid-column' })
            return
          }
          try {
            const task = await store.update(id, { title, note, column })
            writeJson(res, 200, { ok: true, task })
          } catch (error) {
            writeJson(res, 400, { ok: false, error: errorMessage(error) })
          }
          return
        }
        if (method === 'DELETE') {
          // Remove: ?id=<task id>
          const id = new URL(req.url ?? '/', 'http://localhost').searchParams.get('id')
          if (id === null || id === '') {
            writeJson(res, 400, { ok: false, error: 'invalid-id' })
            return
          }
          try {
            const removed = await store.remove(id)
            if (!removed) {
              writeJson(res, 404, { ok: false, error: 'task-not-found' })
              return
            }
            writeJson(res, 200, { ok: true })
          } catch (error) {
            writeJson(res, 400, { ok: false, error: errorMessage(error) })
          }
          return
        }
        writeJson(res, 405, { ok: false, error: 'method-not-allowed' })
      },
    },
  ]
}

/**
 * Mount the board routes.
 * @param ctx - context carrying webServer.
 */
export function apply(ctx: Context): void {
  ctx.effect(() => {
    const store = new BoardStore(boardFilePath())
    const disposers = makeBoardRoutes(store).map(route => ctx.webServer.register(route))
    return () => { for (const dispose of disposers) dispose() }
  }, 'dsh-dt-board: /api/dsh-dt-board routes')
}
