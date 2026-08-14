# @masked-knight02/dsh-client-ui-dt-pet

[English](README.md) | 中文

我的第二个 DSH Web GUI 插件：侧边栏「桌宠状态」入口 + 实时状态面板。host 半区注册 `/api/dsh-dt-pet/status` 路由，读取桌宠进程写入的共享状态文件（`idle` / `thinking` / `working` / `success` / `error` / `waiting`）；浏览器半区在侧边栏注入入口，打开面板后轮询 host 路由展示真实状态。作为 dsh profile bundle 激活。

## 功能

- **host 半区**：`/api/dsh-dt-pet/status` 读取共享 pet 状态文件（多候选位置，取最新修改的文件，与桌面端协议一致）：`mode`、`message`、`updated`、来源路径。
- **浏览器半区**：侧边栏「桌宠状态」入口（DOM 级注入，MutationObserver 自愈），点击打开状态面板；面板每 700ms 轮询 host 路由，状态徽标颜色随模式变化。
- **真实状态联动**：桌宠进程写入状态文件后，面板立即反映（如 `working` 蓝色 → `success` 绿色）。

## 安装

```sh
dsh plugin --profile web add link:<绝对路径>/plugins/dsh-dt-pet
```

重启 `dsh web`，侧边栏出现「桌宠状态」入口。

## 配置

无。状态文件位置与现有桌宠协议一致（`DSH_STATE_DIR` 环境变量优先，回退到 `~/.dsh/pink-soul-dt`、`.pet-state`、`../dsh-pet/.state`）。

## 已知限制

- 面板是轮询快照（700ms），不是 SSE 推送；需要实时推送可后续加事件流。
- 侧边栏入口依赖 shell 的 DOM 结构（`[data-pane="sidebar"]` 与 logoRow 祖先），不同 shell 版本需按 DOM 结构调整注入点。
