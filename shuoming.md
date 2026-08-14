# 项目说明（shuoming.md）

## 这是什么

本目录是从 **Windows 机器**打包导出的 `dsh-dt-ui` 完整开发源码，发给 macOS
继续开发使用。包含：

- `src/` — 主应用源码（Vite + React 复刻工作台，含聊天、任务看板、Git 图谱、
  皮肤中心、SSH、手机远程、更新检查等面板）
- `plugins/` — 5 个自己的 DSH Cordis 插件（双半区 host/client）：
  - `dsh-dt-status` — 工作区状态（读真实 workspace registry）
  - `dsh-dt-pet` — 桌宠状态联动（读真实状态文件）
  - `dsh-dt-git` — 真实 Git 图谱（subprocess + workspace 门禁）
  - `dsh-dt-run` — 任务执行（真实 session.prompt）
  - `dsh-dt-ssh` — SSH 运维（真实 ssh2 连接）
- `dsh-web-ui-main/` — 本地参考仓库（github.com/zhu1090093659/dsh-web-ui），
  复刻时的主要对照来源，**不要修改**，只读参考
- `public/` — 桌宠动画帧、背景图
- `陶喆浅色.png` — 工作台背景图（皮肤中心使用）
- Windows 启动脚本（`启动 DSH 工作台.bat/.ps1`、`设置桌宠状态.ps1`）已移除；
  macOS 直接用下文命令

## 已排除的内容（请勿找回，均可在 Mac 上重建）

打包时排除了以下目录，Mac 上需要重新生成：

```text
node_modules/          → 各目录 pnpm install
plugins/*/node_modules → 各插件 pnpm install
plugins/*/lib          → 各插件 pnpm run build
dist/                  → pnpm build
.pet-state/            → 运行时生成（桌宠状态目录）
.logs/                 → 运行时生成（启动日志）
dsh-web-ui-main.zip    → 已解压为 dsh-web-ui-main/
.git                   → 主项目 git 历史（可重新 clone 或 git init）
```

## 环境要求（macOS）

```text
Node.js  >= 24（建议用 nvm 安装）
pnpm     >= 11（corepack enable 即可）
git      任意
DSH CLI  （参考项目插件需要在真实 dsh web 中运行验证）
Python3  （桌宠 Tkinter：macOS 系统 Python3 通常不带 Tk，
          需要 brew install python-tk，或用 python.org 安装包）
```

## Mac 上的首次启动步骤

### 1. 主应用（Vite 复刻版，无需 DSH）

```bash
cd dsh-dt-ui
npm install        # 或 pnpm install
npm run dev
# 浏览器打开 http://localhost:5173
```

### 2. 各插件（真实 DSH 能力）

每个插件独立安装依赖并构建：

```bash
cd plugins/dsh-dt-status && pnpm install && pnpm run build && cd ../..
cd plugins/dsh-dt-pet    && pnpm install && pnpm run build && cd ../..
cd plugins/dsh-dt-git    && pnpm install && pnpm run build && cd ../..
cd plugins/dsh-dt-run    && pnpm install && pnpm run build && cd ../..
cd plugins/dsh-dt-ssh    && pnpm install && pnpm run build && cd ../..
```

> 注意：`dsh-dt-ssh` 依赖 `ssh2`，pnpm 11 需要批准构建脚本。若安装报
> `Ignored build scripts`，在 `plugins/dsh-dt-ssh/pnpm-workspace.yaml` 里已
> 预置 `allowBuilds` 配置，pnpm 应自动读取；若仍被忽略，运行
> `pnpm approve-builds` 手动批准。

### 3. 注册插件到 DSH profile 并启动 dsh web

```bash
dsh plugin --profile web add link:$(pwd)/plugins/dsh-dt-status
dsh plugin --profile web add link:$(pwd)/plugins/dsh-dt-pet
dsh plugin --profile web add link:$(pwd)/plugins/dsh-dt-git
dsh plugin --profile web add link:$(pwd)/plugins/dsh-dt-run
dsh plugin --profile web add link:$(pwd)/plugins/dsh-dt-ssh

dsh --profile web
# 浏览器打开打印的地址（默认 http://127.0.0.1:端口）
```

## 需要继承的（Windows 上已定型，Mac 保持一致）

1. **插件骨架约定**：每个插件都是 Cordis 双半区包——`cordis.patch.yml` bundle
   声明、`dsh.client` 浏览器注入声明、`src/index.ts`（host）+ `src/client/`
   （browser）、`build/` 自包含 tsdown 预设（Apache-2.0）、tsconfig 双
   program 分层、中英双语 README。
2. **SDK 版本**：`@deepseek-ai/*` 全部 `^0.1.0-rc.6`（npm 的 `next` tag，
   不是 `latest` 的 0.0.1-rc.1）。新增 SDK 依赖务必用 `@next`。
3. **构建链**：`pnpm run build` = `tsc -b && tsdown`；`pnpm run typecheck`
   单独查类型。
4. **跨平台纪律**（已在 Windows 上落实，Mac 继续遵守）：
   - 换行符统一 LF（`.gitattributes` 强制）
   - 路径一律用 `node:path`，不硬编码分隔符
   - 不写平台专属 shell 命令
   - 桌宠状态文件协议：`{mode, message, updated}`，mode ∈
     idle/thinking/working/success/error/waiting
5. **数据位置**：
   - 任务/插件状态：浏览器 `localStorage`（`dsh.taskBoard.v1`、
     `dsh.plugins.enabled`、`dsh.dtRun.v1` 等）
   - 桌宠状态文件：`DSH_STATE_DIR` 环境变量优先，回退
     `~/.dsh/pink-soul-dt/status.json`、`.pet-state/status.json`
   - SSH 主机配置：`~/.dsh/dsh-dt-ssh.json`（0600）
6. **验证流程**：改插件后 `pnpm run build` → `dsh plugin ... add`（link 方式）
   → 重启 `dsh web` → 探测路由/看 UI。

## 需要改的（Windows → macOS 差异）

1. **启动脚本**：原 Windows 专用的 `启动 DSH 工作台.ps1/.bat`、
   `设置桌宠状态.ps1` 已删除。macOS 直接：

   ```bash
   # 启动工作台
   npm run dev &                                              # 前端
   python3 ../dsh-pet/Dsh-Pink-Soul-DT.py 2>/dev/null &       # 桌宠（如有）
   ```

   ```bash
   # 设置桌宠状态
   export DSH_STATE_DIR="$(pwd)/.pet-state"
   python3 ../dsh-pet/Dsh-Pink-Soul-DT.py --status success --message "hello"
   ```

2. **桌宠 Python**：`dsh-pet` 不在本包里（在 `E:\harness\dsh\dsh-pet`），Mac
   上如需要桌宠动画需另取；本包只含 `public/pet/` 动画帧和状态读取逻辑。

3. **路径**：Windows 反斜杠路径（如 `E:\harness\...`）只出现在历史提交和
   `vite.dev.config.js` 的候选状态文件列表中，Mac 上会自动回退到
   `~/.dsh/pink-soul-dt` 或本地 `.pet-state`，无需改动；若 `DSH_STATE_DIR`
   指向 Windows 路径，需改为 Mac 实际路径。

4. **中文编码**：Windows 上 PowerShell 可能把中文写坏（历史上有过）。本次
   导入时已把 `src/main.jsx` 里的 `\uXXXX` 转义与各插件的 BOM/CRLF 全部清理
   为 UTF-8 + LF；Mac 上默认 UTF-8，正常读写即可。若再看到乱码，用
   `iconv -f GBK -t UTF-8 文件名` 转换。

5. **dsh CLI**：Windows 上是 npx 缓存安装，Mac 上重新安装：
   `npm install -g @deepseek-ai/dsh`（或按官方文档），确保 `dsh` 在 PATH。

## 参考仓库注意事项

`dsh-web-ui-main/` 是官方全家桶的**源码副本**，主要用途：

- 复刻页面结构、交互、插件形态的对照
- 插件构建预设 `build/tsdown.client.ts` 就是从它 `shared/` 复制的
  （Apache-2.0，保留版权注释）

**不要**直接修改它；需要看插件实现（任务看板、SSH、Git 图谱、远程控制等）
时进去读源码。它是独立 git 仓库（GitHub），如需最新代码可单独 clone。

## Git 与远程

主项目 `.git` 未打包。Mac 上两种方式接回：

```bash
# 方式 A：直接 clone 远程（推荐，保留历史）
git clone https://github.com/Masked-knight02/dsh-ui.git dsh-dt-ui

# 方式 B：使用本包（无历史），重新关联远程
cd dsh-dt-ui
git init
git remote add origin https://github.com/Masked-knight02/dsh-ui.git
git add .
git commit -m "feat: import from windows package"
git push -u origin main
```

> 提交作者建议保持与 GitHub 一致（本机 git 已按此配置）：
> `git config user.name "Masked-knight02"`
> `git config user.email "133550527+Masked-knight02@users.noreply.github.com"`

## 常见问题

- **pnpm 报 `Ignored build scripts`**：见上文 ssh2 说明，用 `pnpm approve-builds`
- **dsh web 起不来**：确认 `dsh --version` ≥ 0.1.0-rc.6；必要时
  `dsh plugin --profile web remove @masked-knight02/dsh-client-ui-*` 逐个排查
- **桌宠状态不更新**：确认 `.pet-state/status.json` 存在且是最近修改的文件
- **插件改了不生效**：`pnpm run build` 后必须重启 `dsh web`（link 安装引用
  本地目录，但 host 加载的是启动时的产物）
