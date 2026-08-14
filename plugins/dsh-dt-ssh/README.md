# @masked-knight02/dsh-client-ui-dt-ssh

English | [中文](README.zh.md)

My fifth dsh Web GUI plugin: a sidebar "SSH ops" entry plus a real SSH
operations panel. The host half uses the `ssh2` package for real connections:
host config persists to `~/.dsh/dsh-dt-ssh.json` (0600), connect tests run a
real handshake, and command exec runs a real remote `ssh2.exec`; the browser
half injects the sidebar entry and the panel does host CRUD, connect test, and
remote command execution. Activates as a dsh profile bundle.

## Features

- **Host half**: the `/api/dsh-dt-ssh/*` route family:
  - `GET /hosts` reads the host list;
  - `POST /save` / `POST /delete` add/remove (persisted to
    `~/.dsh/dsh-dt-ssh.json`, dir 0700 / file 0600);
  - `POST /test` runs a real ssh2 handshake and reports latency;
  - `POST /exec` runs a real remote command (30s timeout, stdout/stderr
    separated).
- **Browser half**: a sidebar "SSH ops" entry (DOM-level injection with a
  self-healing MutationObserver); the panel has a host form (alias / address /
  port / user / key or password), the host list, connect test, and remote
  command execution with output.

## Install

```sh
dsh plugin --profile web add link:<absolute-path>/plugins/dsh-dt-ssh
```

Restart `dsh web`; the sidebar shows the "SSH ops" entry.

## Config

None. Host config lives in `~/.dsh/dsh-dt-ssh.json`.

## Security model

- Host config with a password stores it in plaintext in
  `~/.dsh/dsh-dt-ssh.json` (0600), the same trust model as the reference
  `dsh-ssh` plugin.
- Command output returns verbatim (no redaction) - commands like `env` may
  bring remote secrets back into the conversation; be aware of this surface.
- Execution consumes real remote resources; confirm before operating.

## Known limitations

- No persistent connection pool: each test/exec opens a fresh connection (the
  reference has a pool and ProxyJump; could be added later).
- No PTY web terminal, SFTP, port-forward tunnels, or cluster execution (the
  reference `dsh-ssh` provides them; this plugin focuses on host management
  and command execution).
- The sidebar entry depends on the shell DOM structure
  (`[data-pane="sidebar"]` and the logoRow ancestor); shell layout changes may
  require adjusting the injection point.
