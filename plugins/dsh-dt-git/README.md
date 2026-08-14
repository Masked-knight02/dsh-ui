# @masked-knight02/dsh-client-ui-dt-git

English | [中文](README.zh.md)

My third dsh Web GUI plugin: a sidebar "Git graph" entry plus a real commit
history panel. The host half runs real git commands through the managed
subprocess service (`git branch` / `for-each-ref` / `log`) scoped to
registered workspaces; the browser half injects the sidebar entry and requests
the active workspace's real branch and commit data. Activates as a dsh profile
bundle.

## Features

- **Host half**: `/api/dsh-dt-git/overview?path=<workspace>` runs real git
  commands for the current branch, the local branch list, and the latest 15
  commits (oid / subject / author / relative time / ref). Workspace gate: the
  requested path must equal a registered workspace's realpath or the request
  is rejected with `403` - the browser can only run git on workspace roots,
  never arbitrary host directories.
- **Browser half**: a sidebar "Git graph" entry (DOM-level injection with a
  self-healing MutationObserver) that opens the panel; the panel pulls the
  active workspace's real data from the host route.
- **Real data**: branch chips, current-branch highlight, and the commit
  timeline all come from the actual git repository on disk.

## Install

```sh
dsh plugin --profile web add link:<absolute-path>/plugins/dsh-dt-git
```

Restart `dsh web`; the sidebar shows the "Git graph" entry.

## Config

None. Operations are read-only (no `git switch` / `create`).

## Known limitations

- The graph shows the latest 15 commits only; paging could be added later.
- Branch switch/create are not implemented (the reference `dsh-git-graph`
  provides full write operations; this plugin focuses on the read-only graph).
- The sidebar entry depends on the shell DOM structure
  (`[data-pane="sidebar"]` and the logoRow ancestor); shell layout changes may
  require adjusting the injection point.
