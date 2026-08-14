# @masked-knight02/dsh-client-ui-dt-panel

[English](README.md) | 中文

一个 DSH Web GUI 插件：侧边栏「文件面板」入口 + 三标签面板（文件 / 变更 / 预览），数据来自真实的工作目录。host 半区注册三个只读路由——文件树（`/api/dsh-dt-panel/files`）、git 变更列表（`/api/dsh-dt-panel/changes`）、单文件内容（`/api/dsh-dt-panel/file`）；浏览器半区在侧边栏注入入口并渲染面板。作为 dsh profile bundle 激活。

## 功能

- **host 半区**：基于 `process.cwd()` 的三个只读路由：
  - `/api/dsh-dt-panel/files?path=<相对路径>&depth=<深度>` 枚举文件树，返回 `{name, dir, path}` 行；目录排在前面，浏览器点击子目录时用更深的 `path` 重新请求。
  - `/api/dsh-dt-panel/changes` 执行 `git status --porcelain` 并解析各行（新增 / 修改 / 删除 / 重命名 / 未跟踪 / …）；git 失败时返回空列表而不是报错。
  - `/api/dsh-dt-panel/file?path=<相对路径>` 读取单个普通文件（UTF-8，最大 256 KB）供预览标签使用。
- **浏览器半区**：侧边栏「文件面板」入口（DOM 级注入，MutationObserver 自愈），点击打开面板；文件标签展示真实目录树并可逐层进入子目录，变更标签列出真实 git 状态，预览标签显示所选文件内容。
- **真实数据**：文件树来自实际工作目录，变更列表来自仓库真实状态——全部真实，无 mock。

## 安装

```sh
dsh plugin --profile web add link:<绝对路径>/plugins/dsh-dt-panel
```

重启 `dsh web`，侧边栏出现「文件面板」入口。

## 配置

无。两个路由都作用于 host 进程的 `process.cwd()`；深度（默认 1）与要列出的目录是请求参数。

## 安全模型

面板严格只读，并防止越出工作目录：

- 每个请求的 `path` 都用 `node:path` 解析，必须落在 `process.cwd()` 之内——绝对路径、`..` 穿越与空字节一律返回 HTTP 400 拒绝。
- 文件树遍历限制为 `MAX_DEPTH`（4）层与 `MAX_ENTRIES`（500）条；超限时响应带截断标记。
- 每一层都跳过 `node_modules` 与 `.git`。
- 指向目录的符号链接按文件展示、不递归（无环路或越权风险）；不可读目录静默跳过。
- 内容路由只服务普通文件，大小上限 256 KB，二进制内容标记后不返回。
- `git status --porcelain` 是只读命令，经 `child_process.execFileSync`（无 shell）执行；任何失败都返回空列表。
- 插件从不写入文件系统。

## 已知限制

- 文件树是每次请求的快照；不做目录实时监听。
- 侧边栏入口依赖 shell 的 DOM 结构（`[data-pane="sidebar"]` 与 logoRow 祖先），不同 shell 版本需按 DOM 结构调整注入点。
- 预览限 256 KB UTF-8 文本；二进制与更大的文件显示提示而不展示内容。
