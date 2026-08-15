# skins

English | [中文](README.zh.md)

The dsh-dt-ui skin collection. Each skin is a `skins/<id>/skin.json` manifest;
the skin center (`plugins/dsh-dt-skins/`) auto-discovers `skins/*/skin.json` and
lists them for switching. The wallpaper PNGs live in `background/` and are
served by the skin center's asset route.

## Skins

| id | theme | asset |
| --- | --- | --- |
| dt-light | light | background/dt-light.png |
| dt-dark | dark | background/dt-dark.png |
| dt-light-deep | light | background/dt-light-deep.png |

## Add a skin

Create `skins/<id>/skin.json` with the standard manifest fields (id, name,
nameEn, tagline, accent, bodyAttr, preview, theme, order) and drop the wallpaper
into `background/<id>.png`. The skin center picks it up on the next reload. See
the `skin-developer` skill for the full contract.
