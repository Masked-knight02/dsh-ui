# @masked-knight02/dsh-client-ui-dt-remote

English | [中文](README.zh.md)

A dsh Web GUI plugin for mobile remote control: a sidebar "手机远程" (mobile
remote) entry plus a pairing panel. The host half registers the
`/api/dsh-dt-remote/pair` route, which mints a real one-time token
(`crypto.randomBytes`), enumerates the machine's LAN IPv4 addresses
(`node:os` networkInterfaces), and stamps an expiry deadline; the browser half
injects the sidebar entry and renders the pairing panel, drawing a
deterministic 21x21 QR-style grid from the token (the same qr-grid algorithm
as the preview app's RemotePanel). Activates as a dsh profile bundle.

## Features

- **Host half**: `/api/dsh-dt-remote/pair` returns a fresh JSON envelope per
  request: `token` (16 random bytes as hex), `addresses` (non-internal IPv4
  LAN addresses), `port` (derived from the request's Host header), `expiresAt`
  and `ttlMs` (10 minutes). `Cache-Control: no-store` keeps every request a
  fresh pairing attempt.
- **Browser half**: a sidebar "手机远程" entry (DOM-level injection with a
  self-healing MutationObserver) that opens the pairing panel; the panel
  fetches the host route, draws the QR-style grid from the token, builds the
  phone-side link `http://<address>:<port>/m?pair=<token>` per LAN address,
  shows the expiry time, and offers refresh (new token) and copy-link actions.
- **Real data, deterministic pattern**: the token is genuinely random per
  request, the addresses are the machine's actual interfaces, and the same
  token always draws the same 21x21 grid - refreshing the token changes the
  pattern.

## Install

```sh
dsh plugin --profile web add link:<absolute-path>/plugins/dsh-dt-remote
```

Restart `dsh web`; the sidebar shows the "手机远程" entry.

## Config

None. The token lifetime is fixed at 10 minutes; the LAN addresses come from
`node:os` networkInterfaces (non-internal IPv4 only), and the port is read
from each request's Host header.

## Known limitations

- The QR grid is a visual token fingerprint, not a standards-compliant QR
  code - a phone cannot decode it with a generic scanner; the pairing link
  text below the grid is the real entry point.
- The panel is a fetch-on-open snapshot; the expiry text does not tick down,
  and refreshing the token replaces the grid immediately.
- The sidebar entry depends on the shell DOM structure
  (`[data-pane="sidebar"]` and the logoRow ancestor); shell layout changes may
  require adjusting the injection point.
