# @masked-knight02/dsh-client-ui-dt-stats

[English](README.md) | 中文

DSH Web GUI 实时统计插件：侧边栏「实时统计」入口 + 实时面板，展示 TPS / 上下文 / token 估算。host 半区注册 `/api/dsh-dt-stats/snapshot` 路由，基于真实进程指标（`process.memoryUsage()`、`process.uptime()`）与插件自身请求计数器（请求/响应字节、滑动窗口请求速率、小型响应体 LRU 缓存）生成快照；浏览器半区在侧边栏注入入口，面板每秒轮询 host 路由。作为 dsh profile bundle 激活。

## 功能

- **host 半区**：`/api/dsh-dt-stats/snapshot` 返回真实 RSS / 堆内存 / 运行时长，以及 TPS（10 秒滑动窗口与激活期平均）和输入 / 输出 / 缓存 token 估算 —— 全部由路由真实观测到的请求与响应字节推导，没有编造的数字。
- **浏览器半区**：侧边栏「实时统计」入口（DOM 级注入，MutationObserver 自愈），点击打开面板；面板每秒轮询 host 路由，展示内存、时长、TPS 与 token。
- **真实数据联动**：host 进程运行期间，面板实时反映进程内存与运行时长；计数器随真实流量增长。

## 安装

```sh
dsh plugin --profile web add link:<绝对路径>/plugins/dsh-dt-stats
```

重启 `dsh web`，侧边栏出现「实时统计」入口。

## 配置

无。token 为估算值（1 token ≈ 4 字节 UTF-8 JSON 流量）；TPS 只统计本插件自身路由的流量。

## 已知限制

- 面板是轮询快照（1s），不是 SSE 推送；需要实时推送可后续加事件流。
- token 为基于字节计数器的启发式估算，不是 LLM 遥测；它反映流量规模而非模型内部。
- 侧边栏入口依赖 shell 的 DOM 结构（`[data-pane="sidebar"]` 与 logoRow 祖先），不同 shell 版本需按 DOM 结构调整注入点。
