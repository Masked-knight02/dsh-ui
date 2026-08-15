# skins

[English](README.md) | 中文

dsh-dt-ui 的皮肤集合。每个皮肤 = `skins/<id>/skin.json` 清单；皮肤中心
（`plugins/dsh-dt-skins/`）自动按 `skins/*/skin.json` 收录并列出供切换。壁纸
PNG 放在 `background/`，由皮肤中心的 asset 路由提供。

## 皮肤

| id | theme | 资源 |
| --- | --- | --- |
| dt-light | light | background/dt-light.png |
| dt-dark | dark | background/dt-dark.png |
| dt-light-deep | light | background/dt-light-deep.png |

## 新增皮肤

新建 `skins/<id>/skin.json`（含 id、name、nameEn、tagline、accent、bodyAttr、
preview、theme、order 等标准字段），并把壁纸放进 `background/<id>.png`。下次
重载后皮肤中心即自动收录。完整契约见 `skin-developer` skill。
