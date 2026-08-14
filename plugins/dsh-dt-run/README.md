# @masked-knight02/dsh-client-ui-dt-run

English | [中文](README.zh.md)

My fourth dsh Web GUI plugin: a sidebar "Task run" entry plus a real task
execution panel. The panel creates a task (title + prompt) and runs it through
dsh's real session machinery: connect the workspace blank session, rename it to
the task title, send the prompt with `session.prompt`, then subscribe to the
session snapshot until that turn settles. Task history persists in browser
localStorage. Activates as a dsh profile bundle.

## Features

- **Real execution**: `workspaces.connectWorkspace` connects the recent
  workspace's blank session, `session.rename` renames it to the task title,
  `session.prompt` sends the task prompt, and the session snapshot watch
  decides success/failure once `turnEnds` passes the baseline.
  **Execution consumes API quota.**
- **Browser half**: a sidebar "Task run" entry (DOM-level injection with a
  self-healing MutationObserver) that opens the panel; the panel creates
  tasks, runs them, and shows the running/done/failed history.
- **Local persistence**: task history lives in `localStorage`
  (key `dsh.dtRun.v1`) and survives refreshes.
- **Host half**: the `/api/dsh-dt-run/health` health-check route.

## Install

```sh
dsh plugin --profile web add link:<absolute-path>/plugins/dsh-dt-run
```

Restart `dsh web`; the sidebar shows the "Task run" entry.

## Config

None. The history key is `dsh.dtRun.v1`; the execution logic mirrors the
reference `dsh-task-board` ExecutionService (framework-free structural faces +
real session driving).

## Known limitations

- Only one running task at a time (to avoid concurrent quota use).
- Conversation snapshots only stay warm for the current/staged session;
  reconcile of background tasks (re-deciding unsettled sessions after reload)
  is not implemented yet - a task left `running` must be re-run manually.
- No cron scheduling yet (the reference has a browser-side 5-field cron
  scheduler that could be added later).
- The sidebar entry depends on the shell DOM structure
  (`[data-pane="sidebar"]` and the logoRow ancestor); shell layout changes may
  require adjusting the injection point.
