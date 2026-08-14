# @masked-knight02/dsh-client-ui-dt-stats

English | [中文](README.zh.md)

A live stats plugin for the dsh Web GUI: a sidebar "Live stats" entry plus a
real-time panel showing TPS / context / token estimates. The host half
registers the `/api/dsh-dt-stats/snapshot` route and answers with a snapshot
built from real process metrics (`process.memoryUsage()`, `process.uptime()`)
and the plugin's own request counters (request/response bytes, a sliding-window
request rate, a small response-body LRU cache); the browser half injects the
sidebar entry and polls the host route every second. Activates as a dsh
profile bundle.

## Features

- **Host half**: `/api/dsh-dt-stats/snapshot` returns real RSS / heap /
  uptime, plus TPS (a sliding 10s window and the activation average) and
  input / output / cache token estimates derived from the actual request and
  response bytes the route observes — no fabricated numbers.
- **Browser half**: a sidebar "Live stats" entry (DOM-level injection with a
  self-healing MutationObserver) that opens the panel; the panel polls the
  host route every second and renders memory, duration, TPS and tokens.
- **Real data linkage**: as long as the host process runs, the panel reflects
  the actual process memory and uptime; the counters move with real traffic.

## Install

```sh
dsh plugin --profile web add link:<absolute-path>/plugins/dsh-dt-stats
```

Restart `dsh web`; the sidebar shows the "Live stats" entry.

## Config

None. Token figures are estimates (1 token ≈ 4 UTF-8 bytes of JSON traffic);
TPS counts this plugin's own route traffic only.

## Known limitations

- The panel is a 1s polling snapshot, not an SSE push; a live stream could be
  added later.
- Token figures are heuristic estimates derived from byte counters, not LLM
  telemetry; they track traffic volume, not model internals.
- The sidebar entry depends on the shell DOM structure
  (`[data-pane="sidebar"]` and the logoRow ancestor); shell layout changes may
  require adjusting the injection point.
