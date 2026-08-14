/**
 * Execution service for the task-run plugin: runs a task through dsh's real
 * session machinery. The panel's Run button must make dsh actually work, not
 * fake a status: the service connects a real session (workspace blank-session
 * reuse via the workspaces service), renames it to the task title, sends the
 * task prompt with `session.prompt`, and then watches the session's
 * conversation snapshot until its turn settles.
 *
 * Deliberately framework-free: the runtime faces are declared structurally
 * (a narrow slice of the real `ctx.sessions` / `ctx.workspaces` contracts).
 * @module @masked-knight02/dsh-client-ui-dt-run/core/execution
 */

/** The narrow sessions face the service needs. */
export interface SessionsRunFace {
  binding(id: string): { session: SessionDriver } | undefined
}

/** The narrow workspaces face the service needs. */
export interface WorkspacesRunFace {
  list: {
    getSnapshot(): {
      items: readonly { workspaceId: string }[]
      recentWorkspaceId: string | undefined
    }
  }
  connectWorkspace(workspaceId: string): Promise<string>
}

/** The behavior verbs the service invokes on an execution session. */
export interface SessionDriver {
  rename(title: string): Promise<unknown>
  prompt(
    content: readonly unknown[],
    mode: 'queue',
  ): Promise<{ ok: true } | { ok: false; error: unknown }>
  getSnapshot(): { running: boolean; lastAgentError: string | null; turnEnds: ReadonlyMap<number, number> }
  subscribe(fn: () => void): () => void
}

/** Everything the service needs from the runtime. */
export interface RunEnvironment {
  sessions: SessionsRunFace
  workspaces: WorkspacesRunFace
}

/** Outcome events the service emits to the caller. */
export type RunEvent =
  | { kind: 'started'; taskId: string; sessionId: string }
  | { kind: 'settled'; taskId: string; outcome: 'succeeded' | 'failed' | 'cancelled'; error?: string }

/** Human copy for a run failure. */
function messageOf(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}

/**
 * Run one task to completion (or to a settled failure).
 * @param taskId - the task being executed.
 * @param title - the task title (used as the prompt fallback and rename).
 * @param prompt - the prompt text sent to dsh.
 * @param onEvent - callback for started/settled events.
 * @returns resolves when the run settles; never rejects.
 */
export async function runTask(
  env: RunEnvironment,
  taskId: string,
  title: string,
  prompt: string,
  onEvent: (event: RunEvent) => void,
): Promise<void> {
  try {
    const sessionId = await connectSession(env)
    onEvent({ kind: 'started', taskId, sessionId })
    const driver = env.sessions.binding(sessionId)?.session
    if (driver === undefined) {
      onEvent({ kind: 'settled', taskId, outcome: 'failed', error: 'execution session is not ready' })
      return
    }
    // Best-effort rename so the execution is recognizable in the session list.
    await driver.rename(title).catch(() => { /* rename is cosmetic */ })
    // Baseline the turn counter BEFORE the prompt round-trip.
    const baseline = driver.getSnapshot().turnEnds.size
    const accepted = await driver.prompt([{ type: 'text', text: prompt.trim() !== '' ? prompt : title }], 'queue')
    if (!accepted.ok) {
      onEvent({
        kind: 'settled', taskId, outcome: 'failed',
        error: messageOf(accepted.error),
      })
      return
    }
    await watchForSettlement(driver, taskId, onEvent, baseline)
  } catch (error) {
    onEvent({
      kind: 'settled', taskId, outcome: 'failed',
      error: messageOf(error),
    })
  }
}

/** Connect the recent (or first) workspace's blank session. */
async function connectSession(env: RunEnvironment): Promise<string> {
  const workspace = env.workspaces.list.getSnapshot()
  const workspaceId = workspace.recentWorkspaceId ?? workspace.items[0]?.workspaceId
  if (workspaceId === undefined) {
    throw new Error('no workspace available to run the task in')
  }
  return env.workspaces.connectWorkspace(workspaceId)
}

/** Watch the session snapshot until the turn that was just sent settles. */
function watchForSettlement(
  driver: SessionDriver,
  taskId: string,
  onEvent: (event: RunEvent) => void,
  baseline: number,
): Promise<void> {
  return new Promise<void>(resolve => {
    let settled = false
    const finish = (outcome: 'succeeded' | 'failed' | 'cancelled', error?: string): void => {
      if (settled) return
      settled = true
      unsubscribe()
      onEvent({ kind: 'settled', taskId, outcome, error })
      resolve()
    }
    const check = (): void => {
      const snapshot = driver.getSnapshot()
      if (snapshot.running) return
      if (snapshot.turnEnds.size > baseline) {
        finish(snapshot.lastAgentError !== null ? 'failed' : 'succeeded', snapshot.lastAgentError ?? undefined)
      }
    }
    const unsubscribe = driver.subscribe(check)
    check()
    // Safety net: never hang the panel if the runtime stops pushing.
    const timer = setTimeout(() => {
      const snapshot = driver.getSnapshot()
      if (!snapshot.running && snapshot.turnEnds.size > baseline) {
        finish(snapshot.lastAgentError !== null ? 'failed' : 'succeeded', snapshot.lastAgentError ?? undefined)
      } else if (!settled) {
        finish('cancelled', 'watch timed out without settlement')
      }
    }, 5 * 60_000)
    void timer
  })
}
