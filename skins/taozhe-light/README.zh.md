# @masked-knight02/dsh-client-ui-skin-taozhe-light

[English](README.md) | 中文

陶喆浅色是 dsh-dt-ui 收录的第一个皮肤：以陶喆浅色背景图作为工作台壁纸的浅色皮肤。皮肤是可热插拔的 client bundle——写入 `data-dsh-skin-taozhe-light` body 属性与一条作用域背景规则，并在 dispose 时全部收回。

## 功能

- 挂在 `body[data-dsh-skin-taozhe-light]` 下的浅色全屏壁纸。
- 只写自己收回的东西：body 属性与注入的样式在 dispose 时收回。
- 不注入服务；皮肤只依赖 DOM。

## 安装

```sh
dsh plugin --profile web add link:<绝对路径>/skins/taozhe-light
```

## 配置

无。壁纸资源由 `/skins/taozhe-light.png` 提供。

## 已知限制

- 壁纸 URL 是静态路由；在 dsh web 壳内提供该资源需要把皮肤资源与 bundle 一并发布。
