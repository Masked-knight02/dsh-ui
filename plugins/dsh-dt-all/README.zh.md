# @masked-knight02/dsh-client-ui-dt-all

[English](README.md) | 中文

dsh-dt-ui 插件全家桶聚合包：安装这一个，等于一次激活全部功能插件（status / pet / git / run / ssh / board / stats / remote / panel / skins）。聚合包本身没有插件逻辑，只在 `cordis.patch.yml` 里汇总全家桶的 `insert` 行，并通过 dependencies 引入全部子包。

## 是什么

- **一次安装、全部到位**：其 dependencies 引入全部十个功能插件包（dsh-client-ui-dt-status / dsh-client-ui-dt-pet / dsh-client-ui-dt-git / dsh-client-ui-dt-run / dsh-client-ui-dt-ssh / dsh-client-ui-dt-board / dsh-client-ui-dt-stats / dsh-client-ui-dt-remote / dsh-client-ui-dt-panel / dsh-client-ui-dt-skins）。
- **聚合载具**：`cordis.patch.yml` 为每个功能插件插入一行 bundle（`ui-dt-*`），经 dsh 插件 profile 机制挂载；各子包自己的 `dsh.client` 声明负责加载浏览器半区。

## 聚合插件清单

| bundle 行 id | npm 包名 |
| --- | --- |
| ui-dt-status | @masked-knight02/dsh-client-ui-dt-status |
| ui-dt-pet | @masked-knight02/dsh-client-ui-dt-pet |
| ui-dt-git | @masked-knight02/dsh-client-ui-dt-git |
| ui-dt-run | @masked-knight02/dsh-client-ui-dt-run |
| ui-dt-ssh | @masked-knight02/dsh-client-ui-dt-ssh |
| ui-dt-board | @masked-knight02/dsh-client-ui-dt-board |
| ui-dt-stats | @masked-knight02/dsh-client-ui-dt-stats |
| ui-dt-remote | @masked-knight02/dsh-client-ui-dt-remote |
| ui-dt-panel | @masked-knight02/dsh-client-ui-dt-panel |
| ui-dt-skins | @masked-knight02/dsh-client-ui-dt-skins（皮肤中心） |

## 安装

### 从 npm 安装（推荐）

```sh
dsh plugin --profile web add @masked-knight02/dsh-client-ui-dt-all
```

### 从仓库安装（开发调试）

```sh
dsh plugin --profile web add link:<绝对路径>/plugins/dsh-dt-all
```

安装后重启 `dsh web` 使插件生效。

## 已知限制

- 各子插件随本包一起激活；若只需要其中一部分，请直接安装对应子插件包。
- 聚合包本身不声明 `@deepseek-ai/*` SDK 依赖，各子包按各自的 peer 声明解析 SDK。
