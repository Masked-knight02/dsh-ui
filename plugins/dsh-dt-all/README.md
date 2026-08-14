# @masked-knight02/dsh-client-ui-dt-all

English | [中文](README.zh.md)

The one-click aggregate package for the whole dsh-dt-ui plugin family:
installing it activates every functional plugin (status / pet / git / run /
ssh / board / stats / remote / panel / skins) with a single bundle patch.
The aggregate itself carries no plugin logic — it only lists the family's
`insert` rows in `cordis.patch.yml` and pulls every child package through its
dependencies.

## What it is

- **One install, everything on**: its dependencies pull in all ten feature
  plugin packages (dsh-client-ui-dt-status / dsh-client-ui-dt-pet /
  dsh-client-ui-dt-git / dsh-client-ui-dt-run / dsh-client-ui-dt-ssh /
  dsh-client-ui-dt-board / dsh-client-ui-dt-stats / dsh-client-ui-dt-remote /
  dsh-client-ui-dt-panel / dsh-client-ui-dt-skins).
- **Aggregation carrier**: `cordis.patch.yml` inserts one bundle row per
  feature plugin (`ui-dt-*`), mounted through the dsh plugin profile
  mechanism; each child's own `dsh.client` declaration loads its browser half.

## Aggregated plugins

| bundle id | npm package |
| --- | --- |
| ui-dt-status | @masked-knight02/dsh-client-ui-dt-status |
| ui-dt-pet | @masked-knight02/dsh-client-ui-dt-pet |
| ui-dt-git | @masked-knight02/dsh-client-ui-dt-git |
| ui-dt-run | @masked-knight02/dsh-client-ui-dt-run |
| ui-dt-ssh | @masked-knight02/dsh-client-ui-dt-ssh |
| ui-dt-board | @masked-knight02/dsh-client-ui-dt-board |
| ui-dt-stats | @masked-knight02/dsh-client-ui-dt-stats |
| ui-dt-remote | @masked-knight02/dsh-client-ui-dt-remote |
| ui-dt-panel | @masked-knight02/dsh-client-ui-dt-panel |
| ui-dt-skins | @masked-knight02/dsh-client-ui-dt-skins (skin center) |

## Install

### From npm (recommended)

```sh
dsh plugin --profile web add @masked-knight02/dsh-client-ui-dt-all
```

### From the repository (development)

```sh
dsh plugin --profile web add link:<absolute-path>/plugins/dsh-dt-all
```

Restart `dsh web` for the plugins to take effect.

## Known limitations

- Every sub-plugin activates together. For only a subset, install that
  sub-plugin package directly.
- The aggregate itself declares no `@deepseek-ai/*` SDK dependency; each
  child package resolves the SDK through its own peer declarations.
