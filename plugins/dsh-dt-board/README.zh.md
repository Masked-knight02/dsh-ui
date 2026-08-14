# @masked-knight02/dsh-client-ui-dt-board

[English](README.md) | 中文

一个真实的五列任务看板 DSH Web GUI 插件：侧边栏「任务看板」入口 + 看板面板（backlog / todo / running / done / failed）。host 半区把任务账本持久化到 `~/.dsh/dsh-dt-board.json`，提供 `/api/dsh-dt-board/overview` 读取路由与 `/api/dsh-dt-board/tasks` CRUD 路由；浏览器半区在侧边栏注入入口，轮询 host 路由，并把每次变更（新建 / 移动 / 删除）写回 host。作为 dsh profile bundle 激活。

## 功能

- **host 半区**：`/api/dsh-dt-board/overview` 按五个固定列分组返回看板；`/api/dsh-dt-board/tasks` 支持新建（POST）、更新（PATCH，含移动列）与删除（DELETE）任务。账本持久化到 `~/.dsh/dsh-dt-board.json`，采用 tmp + rename 原子写入与串行写入链；文件缺失或损坏时以空看板启动不崩溃，加载时丢弃非法行。
- **浏览器半区**：侧边栏「任务看板」入口（DOM 级注入，MutationObserver 自愈），点击打开面板；面板每 1500ms 轮询 overview 路由，每次新建 / 移动 / 删除写回 host 后重新拉取。
- **真实持久化**：任务在 dsh 重启后仍保存在 `~/.dsh/dsh-dt-board.json`，并可供看板 API 的其他调用方共享。

## 安装

```sh
dsh plugin --profile web add link:<绝对路径>/plugins/dsh-dt-board
```

重启 `dsh web`，侧边栏出现「任务看板」入口。

## 配置

无。账本文件固定为 `~/.dsh/dsh-dt-board.json`（首次写入时自动创建父目录）。

## 已知限制

- 面板是轮询快照（1500ms），不是 SSE 推送；需要实时推送可后续加事件流。
- 侧边栏入口依赖 shell 的 DOM 结构（`[data-pane="sidebar"]` 与 logoRow 祖先），不同 shell 版本需按 DOM 结构调整注入点。
- 任务只能通过左 / 右按钮在列间移动，未实现拖拽。
