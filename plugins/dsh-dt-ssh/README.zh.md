# @masked-knight02/dsh-client-ui-dt-ssh

[English](README.md) | 中文

我的第五个 DSH Web GUI 插件：侧边栏「SSH 运维」入口 + 真实 SSH 操作面板。
host 半区用 `ssh2` 包提供真实连接：主机配置存 `~/.dsh/dsh-dt-ssh.json`
（0600），连接测试走真实握手，命令执行走真实远程 `ssh2.exec`；浏览器半区
在侧边栏注入入口，面板做主机增删改查、测试连接、远程命令执行。作为 dsh
profile bundle 激活。

## 功能

- **host 半区**：`/api/dsh-dt-ssh/*` 路由族：
  - `GET /hosts` 读主机列表；
  - `POST /save` / `POST /delete` 增删（持久化 `~/.dsh/dsh-dt-ssh.json`，
    目录 0700、文件 0600）；
  - `POST /test` 真实 ssh2 握手测延迟；
  - `POST /exec` 真实远程命令执行（30s 超时，stdout/stderr 分离）。
- **浏览器半区**：侧边栏「SSH 运维」入口（DOM 级注入，MutationObserver
  自愈），面板：主机表单（别名/地址/端口/用户/密钥或密码）、主机列表、
  测试连接、远程命令执行与输出。

## 安装

```sh
dsh plugin --profile web add link:<绝对路径>/plugins/dsh-dt-ssh
```

重启 `dsh web`，侧边栏出现「SSH 运维」入口。

## 配置

无。主机配置存 `~/.dsh/dsh-dt-ssh.json`。

## 安全模型

- 主机配置含密码时以明文存 `~/.dsh/dsh-dt-ssh.json`（0600），与参考实现
  `dsh-ssh` 同一信任模型。
- 命令执行输出原样返回（不脱敏）——`env` 之类命令可能把远端环境中的密钥
  带回对话，注意该权限面。
- 执行消耗真实远程资源，操作前先确认。

## 已知限制

- 无持久连接池：每次 test/exec 新建连接（参考实现有连接池与跳板机
  ProxyJump，可后续加入）。
- 无 Web 终端 PTY、无 SFTP、无端口转发、无集群执行（参考 `dsh-ssh` 提供，
  本插件聚焦主机管理与命令执行）。
- 侧边栏入口依赖 shell 的 DOM 结构（`[data-pane="sidebar"]` 与 logoRow
  祖先），不同 shell 版本需按 DOM 结构调整注入点。
