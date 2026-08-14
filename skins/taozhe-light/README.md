# @masked-knight02/dsh-client-ui-skin-taozhe-light

English | [中文](README.zh.md)

Taozhe Light is the first skin in the dsh-dt-ui collection: a light workspace
wallpaper using the personal taozhe background image. The skin is a
hot-pluggable client bundle — it writes the `data-dsh-skin-taozhe-light` body
attribute and a scoped background rule, and retracts both on dispose.

## Features

- Light full-window wallpaper scoped under `body[data-dsh-skin-taozhe-light]`.
- Write-only-what-you-own: the body attribute and injected style are retracted on dispose.
- No services injected; the skin needs only the DOM.

## Install

```sh
dsh plugin --profile web add link:<absolute-path>/skins/taozhe-light
```

## Config

None. The wallpaper asset is served from `/skins/taozhe-light.png`.

## Known limitations

- The wallpaper URL is a static route; serving it inside the dsh web shell requires the asset to be published alongside the skin bundle.
