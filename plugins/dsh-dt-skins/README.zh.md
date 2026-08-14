# @masked-knight02/dsh-client-ui-dt-skins

[English](README.md) | 中文

dsh-dt-ui 家族的皮肤中心插件：侧边栏「皮肤中心」入口 + 面板，自动发现
`skins/*/skin.json` 并按每个皮肤的 body 属性与壁纸进行应用。新增皮肤只需新建
`skins/<id>/` 目录并放入合法 `skin.json`，无需改任何注册表文件。作为 dsh
profile bundle 激活。

## 功能

- **host 半区**：`/api/dsh-dt-skins/registry` 发现 `skins/*/skin.json`，按
  order 返回皮肤清单（id、name、accent、bodyAttr、preview）。
- **浏览器半区**：侧边栏「皮肤中心」入口（DOM 级注入，MutationObserver 自愈），
  点击打开面板。
- **应用 / 重置**：应用皮肤时写入 `body[data-dsh-skin-<id>]` 属性与壁纸；当前
  皮肤 id 持久化在 `localStorage`（`dsh.skin.active`）；重置清除所有
  `data-dsh-skin-*` 属性。

## 安装

```sh
dsh plugin --profile web add link:<绝对路径>/plugins/dsh-dt-skins
```

重启 `dsh web`，侧边栏出现「皮肤中心」入口。

## 配置

- `DSH_SKINS_DIR`：皮肤目录的绝对路径；默认 `<cwd>/skins`。

## 已知限制

- 注册表只返回清单；皮肤本身通过清单的 `bodyAttr` 与 `preview` 字段应用，不加载
  每个皮肤的 client bundle。
- 壁纸 URL 是静态路由；在 dsh web 壳内提供该资源需要把皮肤资源与 bundle 一并发布。
