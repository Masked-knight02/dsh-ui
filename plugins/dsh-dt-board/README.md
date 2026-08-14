# @masked-knight02/dsh-client-ui-dt-board

English | [中文](README.zh.md)

A real five-column task board for the dsh Web GUI: a sidebar "Task board"
entry plus a kanban panel (backlog / todo / running / done / failed). The
host half persists the task ledger to `~/.dsh/dsh-dt-board.json` and exposes
the `/api/dsh-dt-board/overview` read route plus the `/api/dsh-dt-board/tasks`
CRUD route; the browser half injects the sidebar entry, polls the host route
and writes every mutation (create / move / delete) back through it. Activates
as a dsh profile bundle.

## Features

- **Host half**: `/api/dsh-dt-board/overview` returns the board grouped by
  the five fixed columns; `/api/dsh-dt-board/tasks` creates (POST), updates
  (PATCH, including column moves) and deletes (DELETE) tasks. The ledger is
  persisted to `~/.dsh/dsh-dt-board.json` with atomic tmp + rename writes and
  a serialized write chain; a missing or corrupt file starts empty without
  crashing, and invalid rows are dropped on load.
- **Browser half**: a sidebar "Task board" entry (DOM-level injection with a
  self-healing MutationObserver) that opens the panel; the panel polls the
  overview route every 1500ms, and every create / move / delete writes back
  to the host and re-polls.
- **Real persistence**: tasks survive dsh restarts in
  `~/.dsh/dsh-dt-board.json` and are shared with any other consumer of the
  board API.

## Install

```sh
dsh plugin --profile web add link:<absolute-path>/plugins/dsh-dt-board
```

Restart `dsh web`; the sidebar shows the "Task board" entry.

## Config

None. The ledger file is fixed at `~/.dsh/dsh-dt-board.json` (created with
its parent directory on the first write).

## Known limitations

- The panel is a 1500ms polling snapshot, not an SSE push; a live stream
  could be added later.
- The sidebar entry depends on the shell DOM structure
  (`[data-pane="sidebar"]` and the logoRow ancestor); shell layout changes may
  require adjusting the injection point.
- Tasks move between columns through the left/right buttons only; drag and
  drop is not implemented.
