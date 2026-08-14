# @masked-knight02/dsh-client-ui-dt-git

[English](README.md) | 中文

我的第三个 DSH Web GUI 插件：侧边栏「Git 图谱」入口 + 真实提交历史面板。
host 半区通过受管 subprocess 服务执行真实 git 命令（`git branch` /
`for-each-ref` / `log`），并限制在已注册工作区内；浏览器半区在侧边栏注入
入口，打开面板后请求当前激活工作区的真实分支与提交数据。作为 dsh profile
bundle 激活。

## 功能

- **host 半区**：`/api/dsh-dt-git/overview?path=<workspace>` 执行真实 git
  命令读取当前分支、本地分支列表、最近 15 条提交（oid / 标题 / 作者 / 相对
  时间 / ref）。工作区门禁：请求路径必须等于已注册工作区的 realpath，否则
  `403`——浏览器只能对 workspace root 运行 git，不能触碰任意主机目录。
- **浏览器半区**：侧边栏「Git 图谱」入口（DOM 级注入，MutationObserver
  自愈），点击打开面板；面板从 host 路由拉取激活工作区的真实数据渲染。
- **真实数据**：分支胶囊、当前分支高亮、提交时间线全部来自磁盘上的真实
  git 仓库。

## 安装

```sh
dsh plugin --profile web add link:<绝对路径>/plugins/dsh-dt-git
```

重启 `dsh web`，侧边栏出现「Git 图谱」入口。

## 配置

无。操作只读（不执行 `git switch` / `create`）。

## 已知限制

- 图谱当前只读最近 15 条提交；需要更多可分页加载。
- 不执行分支切换/创建（参考实现 `dsh-git-graph` 提供完整写操作，本插件
  聚焦只读图谱）。
- 侧边栏入口依赖 shell 的 DOM 结构（`[data-pane="sidebar"]` 与 logoRow
  祖先），不同 shell 版本需按 DOM 结构调整注入点。
