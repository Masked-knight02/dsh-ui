# @masked-knight02/dsh-client-ui-dt-pet

English | [中文](README.zh.md)

My second dsh Web GUI plugin: a sidebar "Pet status" entry plus a live status
panel. The host half registers the `/api/dsh-dt-pet/status` route reading the
shared pet state file written by the desktop pet process (`idle` / `thinking` /
`working` / `success` / `error` / `waiting`); the browser half injects the
sidebar entry and polls the host route to render the real state. Activates as
a dsh profile bundle.

## Features

- **Host half**: `/api/dsh-dt-pet/status` reads the shared pet state file
  (multiple candidate locations, newest mtime wins, matching the desktop pet
  protocol): `mode`, `message`, `updated`, and the source path.
- **Browser half**: a sidebar "Pet status" entry (DOM-level injection with a
  self-healing MutationObserver) that opens the panel; the panel polls the
  host route every 700ms and the badge color follows the mode.
- **Real state linkage**: as soon as the pet process writes the state file,
  the panel reflects it (e.g. `working` blue to `success` green).

## Install

```sh
dsh plugin --profile web add link:<absolute-path>/plugins/dsh-dt-pet
```

Restart `dsh web`; the sidebar shows the "Pet status" entry.

## Config

None. The state file locations match the existing pet protocol
(`DSH_STATE_DIR` first, falling back to `~/.dsh/pink-soul-dt`,
`.pet-state`, `../dsh-pet/.state`).

## Known limitations

- The panel is a 700ms polling snapshot, not an SSE push; a live stream could
  be added later.
- The sidebar entry depends on the shell DOM structure
  (`[data-pane="sidebar"]` and the logoRow ancestor); shell layout changes may
  require adjusting the injection point.
