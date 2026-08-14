# @masked-knight02/dsh-client-ui-dt-panel

English | [中文](README.zh.md)

A dsh Web GUI plugin: a sidebar "File panel" entry plus a three-tab panel
(Files / Changes / Preview) over the real current working directory. The host
half registers three read-only routes - the file tree
(`/api/dsh-dt-panel/files`), the git change list (`/api/dsh-dt-panel/changes`)
and single-file content (`/api/dsh-dt-panel/file`); the browser half injects
the sidebar entry and renders the panel from these routes. Activates as a dsh
profile bundle.

## Features

- **Host half**: three read-only routes over `process.cwd()`:
  - `/api/dsh-dt-panel/files?path=<rel>&depth=<n>` enumerates the file tree
    as `{name, dir, path}` rows; directories sort first, and the browser
    drills into subdirectories by re-requesting with a deeper `path`.
  - `/api/dsh-dt-panel/changes` runs `git status --porcelain` and parses the
    rows (added / modified / deleted / renamed / untracked / ...); a git
    failure yields an empty list instead of an error.
  - `/api/dsh-dt-panel/file?path=<rel>` reads one regular file (UTF-8, up to
    256 KB) for the Preview tab.
- **Browser half**: a sidebar "File panel" entry (DOM-level injection with a
  self-healing MutationObserver) that opens the panel; the Files tab shows the
  real tree and drills into subdirectories, the Changes tab lists the real
  git status, and Preview shows the selected file's content.
- **Real data**: the tree comes from the actual working directory and the
  change list from the actual repository state - nothing is mocked.

## Install

```sh
dsh plugin --profile web add link:<absolute-path>/plugins/dsh-dt-panel
```

Restart `dsh web`; the sidebar shows the "File panel" entry.

## Config

None. Both routes operate on the host process's `process.cwd()`; the depth
(default 1) and the directory to list are request parameters.

## Security model

The panel is strictly read-only and gated against escaping the working
directory:

- Every requested `path` is resolved with `node:path` and must stay inside
  `process.cwd()` - absolute paths, `..` traversal and null bytes are
  rejected with HTTP 400.
- The file tree walk is capped at `MAX_DEPTH` (4) levels and `MAX_ENTRIES`
  (500) rows; a truncated response carries a flag.
- `node_modules` and `.git` are skipped at every level.
- Symlinked directories are reported as files and never recursed (no cycle or
  escape risk); unreadable directories are skipped silently.
- The content route only serves regular files, caps the size at 256 KB and
  flags binary content instead of returning it.
- `git status --porcelain` is a read-only command run through
  `child_process.execFileSync` (no shell); any failure returns an empty list.
- The plugin never writes to the filesystem.

## Known limitations

- The file tree is a snapshot per request; no live watching of the directory.
- The sidebar entry depends on the shell DOM structure
  (`[data-pane="sidebar"]` and the logoRow ancestor); shell layout changes may
  require adjusting the injection point.
- Preview is capped at 256 KB of UTF-8 text; binary and larger files show a
  notice instead of content.
