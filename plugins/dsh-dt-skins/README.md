# @masked-knight02/dsh-client-ui-dt-skins

English | [中文](README.zh.md)

Skin-center plugin for the dsh-dt-ui family: a sidebar "Skin center" entry plus
a panel that discovers skins under `skins/*/skin.json` and applies each skin by
its body attribute and wallpaper. Adding a skin only needs a new
`skins/<id>/` directory with a valid `skin.json`; no registry file must be
edited. Activates as a dsh profile bundle.

## Features

- **Host half**: `/api/dsh-dt-skins/registry` discovers `skins/*/skin.json` and
  returns the ordered skin manifests (id, name, accent, bodyAttr, preview).
- **Browser half**: a sidebar "Skin center" entry (DOM-level injection with a
  self-healing MutationObserver) that opens the panel.
- **Apply / reset**: applying a skin writes its `body[data-dsh-skin-<id>]`
  attribute and the wallpaper; the active id persists in `localStorage`
  (`dsh.skin.active`); reset clears every `data-dsh-skin-*` attribute.

## Install

```sh
dsh plugin --profile web add link:<absolute-path>/plugins/dsh-dt-skins
```

Restart `dsh web`; the sidebar shows the "Skin center" entry.

## Config

- `DSH_SKINS_DIR`: absolute path to the skins directory; defaults to
  `<cwd>/skins`.

## Known limitations

- The registry lists manifests only; the skin bundle itself is applied through
  the manifest's `bodyAttr` and `preview` fields, not by loading each skin's
  client bundle.
- The wallpaper URL is a static route; serving it inside the dsh web shell
  requires the asset to be published alongside the skin.
