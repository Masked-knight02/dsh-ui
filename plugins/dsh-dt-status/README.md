# @masked-knight02/dsh-client-ui-dt-status

English | [中文](README.zh.md)

My first DSH Web GUI plugin: a sidebar "Status" entry plus a live status panel.
The host half registers the `/api/dsh-dt-status` route reading the real
workspace registry; the browser half injects the sidebar entry and renders the
panel from that route's JSON. Activates as a dsh profile bundle.

## Features

- **Host half**: `/api/dsh-dt-status` returns the real workspace registry list
  (`workspaceRegistry.list()`), the plugin version, and process uptime.
- **Browser half**: a sidebar "Status" entry (DOM-level injection with a
  self-healing MutationObserver) that opens the status panel; the panel fetches
  live data from the host route.
- **Dual-face skeleton**: demonstrates the dsh host/client split, the
  `cordis.patch.yml` bundle declaration, and the `dsh.client` browser-inject
  declaration.

## Install

```sh
dsh plugin --profile web add link:<absolute-path>/plugins/dsh-dt-status
```

Restart `dsh web`; the sidebar shows the "Status" entry.

## Config

None. The plugin works out of the box.

## Known limitations

- The panel renders a read-only snapshot from the host route; no live push yet
  (SSE could be added later).
- The sidebar entry depends on the shell DOM structure
  (`[data-pane="sidebar"]` and the logoRow ancestor); shell layout changes may
  require adjusting the injection point.
