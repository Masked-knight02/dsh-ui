# @masked-knight02/dsh-client-ui-dt-status

[English](README.md) | 中文

我的第一个 DSH Web GUI 插件：侧边栏「状态」入口 + 实时状态面板。host 半区注册
`/api/dsh-dt-status` 路由，读取真实 workspace registry 数据；浏览器半区在侧边栏
注入入口，点击打开面板展示真实工作区列表与运行时间。作为 dsh profile bundle
激活。

## 功能

- **host 半区**：`/api/dsh-dt-status` 路由返回真实 workspace registry 列表
  （`workspaceRegistry.list()`）、插件版本与进程运行时间。
- **浏览器半区**：侧边栏「状态」入口（DOM 级注入，MutationObserver 自愈），
  点击打开状态面板；面板从 host 路由拉取真实数据渲染。
- **双半区骨架**：完整展示 dsh 插件的 host/client 分层、`cordis.patch.yml`
  bundle 声明、`dsh.client` 浏览器注入声明。

## 安装

```sh
dsh plugin --profile web add link:<绝对路径>/plugins/dsh-dt-status
```

重启 `dsh web`，侧边栏出现「状态」入口。

## 配置

无。插件开箱即用。

## 已知限制

- 状态面板数据是 host 路由的只读快照，不订阅实时推送（后续可加 SSE）。
- 侧边栏入口依赖 shell 的 DOM 结构（`[data-pane="sidebar"]` 与 logoRow
  祖先），不同 shell 版本需按 DOM 结构调整注入点。
