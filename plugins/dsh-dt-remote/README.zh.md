# @masked-knight02/dsh-client-ui-dt-remote

[English](README.md) | 中文

移动端远程控制 DSH Web GUI 插件：侧边栏「手机远程」入口 + 配对面板。host 半区注册 `/api/dsh-dt-remote/pair` 路由，用 `crypto.randomBytes` 生成真实的一次性令牌、枚举本机局域网 IPv4 地址（`node:os` networkInterfaces）并盖上过期时间；浏览器半区在侧边栏注入入口并渲染配对面板，用令牌确定性绘制 21×21 简易二维码格点（与预览应用 RemotePanel 的 qr-grid 算法一致）。作为 dsh profile bundle 激活。

## 功能

- **host 半区**：`/api/dsh-dt-remote/pair` 每次请求返回全新 JSON 信封：`token`（16 字节随机数 hex）、`addresses`（非内部 IPv4 局域网地址）、`port`（取自请求 Host 头）、`expiresAt` 与 `ttlMs`（10 分钟）。`Cache-Control: no-store` 保证每次请求都是新的配对尝试。
- **浏览器半区**：侧边栏「手机远程」入口（DOM 级注入，MutationObserver 自愈），点击打开配对面板；面板拉取 host 路由，用令牌绘制二维码格点，按局域网地址生成手机端链接 `http://<地址>:<端口>/m?pair=<令牌>`，展示过期时间，并提供刷新（换新令牌）与复制链接操作。
- **真实数据、确定性图案**：令牌每次请求真随机，地址是本机真实网卡，同一令牌永远画出同一张 21×21 格点 - 刷新令牌即更换图案。

## 安装

```sh
dsh plugin --profile web add link:<绝对路径>/plugins/dsh-dt-remote
```

重启 `dsh web`，侧边栏出现「手机远程」入口。

## 配置

无。令牌有效期固定 10 分钟；局域网地址来自 `node:os` networkInterfaces（仅非内部 IPv4）；端口取自每次请求的 Host 头。

## 已知限制

- 二维码格点是令牌的可视指纹，不是标准 QR 码 - 手机用通用扫码器无法解析；格点下方的配对链接文本才是真正的入口。
- 面板是打开时拉取一次的快照；过期文案不会逐秒倒数，刷新令牌会立即更换格点。
- 侧边栏入口依赖 shell 的 DOM 结构（`[data-pane="sidebar"]` 与 logoRow 祖先），不同 shell 版本需按 DOM 结构调整注入点。
