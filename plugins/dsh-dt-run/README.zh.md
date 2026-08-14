# @masked-knight02/dsh-client-ui-dt-run

[English](README.md) | 中文

我的第四个 DSH Web GUI 插件：侧边栏「任务执行」入口 + 真实任务执行面板。
面板创建任务（标题 + Prompt），通过 dsh 的真实会话机制执行：连接工作区
空白会话、重命名为任务标题、以 `session.prompt` 发送任务提示，再订阅会话
快照直到该轮 settle。任务历史存浏览器 localStorage。作为 dsh profile
bundle 激活。

## 功能

- **真实执行**：`workspaces.connectWorkspace` 连接最近工作区的空白会话 →
  `session.rename` 重命名为任务标题 → `session.prompt` 发送任务提示 →
  订阅会话快照，`turnEnds` 越过基线后判定成功/失败。**执行消耗 API 额度**。
- **浏览器半区**：侧边栏「任务执行」入口（DOM 级注入，MutationObserver
  自愈），点击打开面板；面板创建任务、执行、展示运行中/已完成/已失败历史。
- **本地持久化**：任务历史存 `localStorage`（键 `dsh.dtRun.v1`），刷新后存活。
- **host 半区**：`/api/dsh-dt-run/health` 健康检查路由。

## 安装

```sh
dsh plugin --profile web add link:<绝对路径>/plugins/dsh-dt-run
```

重启 `dsh web`，侧边栏出现「任务执行」入口。

## 配置

无。任务历史键 `dsh.dtRun.v1`；执行逻辑与参考实现 `dsh-task-board` 的
ExecutionService 同构（framework-free 结构接口 + 真实会话驱动）。

## 已知限制

- 一次只允许一个运行中的任务（避免并发消耗）。
- 会话快照只对当前/暂存会话保活；后台任务的 reconcile（重新判定未结束
  会话）暂未实现，刷新后 running 任务需手动重跑。
- 无定时调度（参考实现有 5 段 cron 浏览器调度器，可后续加入）。
- 侧边栏入口依赖 shell 的 DOM 结构（`[data-pane="sidebar"]` 与 logoRow
  祖先），不同 shell 版本需按 DOM 结构调整注入点。
