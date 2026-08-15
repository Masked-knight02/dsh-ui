# AGENTS.md — dsh-dt-ui 仓库规则

dsh-dt-ui 是「陶喆」主题的 DSH Web GUI 项目：一个独立 Vite 预览应用（`src/`）
+ 一组自己的 cordis 插件（`plugins/`）+ 皮肤（`skins/`）+ 桌宠（`pets/`）+
skills（`.dsh/skills/`）。命名与包形态参照官方 dsh-web-ui，但保持本项目自己的
`dsh-dt-*` / `@masked-knight02` 体系。参考仓库 `dsh-web-ui-main/` 只读，不修改。

## 仓库布局

```text
src/                         独立 Vite + React 预览工作台（无需 DSH，npm run dev）
plugins/dsh-dt-<feature>/    功能插件（cordis bundle，host + client 半区）
skins/<skin-id>/             皮肤源包（skin.json + client apply，kebab-case id）
pets/<pet-id>/               桌宠清单（pet.json + 动画帧）
.dsh/skills/<name>/          skills（SKILL.md）
scripts/                     维护脚本（build-all / register-all）
public/                      预览应用静态资产（皮肤背景图、桌宠帧）
```

## 常用命令

```sh
npm run dev               # 启动预览工作台（无需 DSH）
npm run build:plugins     # 一键构建全部插件与皮肤
npm run register:plugins  # 一键把全部插件 link 进 dsh profile
```

## 命名规范

- 插件目录 `plugins/dsh-dt-<feature>`；npm 名
  `@masked-knight02/dsh-client-ui-dt-<feature>`；bundle 行 id `ui-dt-<feature>`。
  `feature` 用单个短词（status / pet / git / run / ssh / board / stats / remote /
  panel / skins）。
- 皮肤 id 用 kebab-case（如 `dt-light`）；npm 名
  `@masked-knight02/dsh-client-ui-skin-<id>`；bundle 行 id `ui-skin-<id>`。
- 桌宠 id 用 kebab-case（如 `taozhe`）；清单 `pet.json`。
- skill 目录 `.dsh/skills/<kebab-name>/SKILL.md`，frontmatter 含 `name` /
  `description` / `whenToUse`。
- 文件名与目录统一 kebab-case；README 固定三件套：`README.md`（英文）+
  `README.zh.md`（中文）+ `README.i18n.yaml`（配对记录）。

## 插件骨架

- 每个插件是独立 cordis bundle 包：`"type": "module"`、
  `dsh.bundle.patch` → `cordis.patch.yml`、`dsh.client` 声明浏览器注入。
  host 半区 `src/index.ts`，browser 半区 `src/client/`，共享纯逻辑 `src/core/`。
- 构建链 `pnpm run build` = `tsc -b && tsdown`；构建预设放包内
  `build/tsdown.client.ts` + `build/web-platform.ts`（五包同源，新增包从现有包复制）。
- SDK 依赖 `@deepseek-ai/*` 全部 `^0.1.0-rc.6`（npm `next` tag）。
- 每个插件 README 三件套；UI 文案中英对照（zh 为 key 源）。

## 皮肤契约

- 一个皮肤 = `skins/<id>/` 一个自包含包：`skin.json`（id / name / nameEn / author /
  tagline / description / tags / accent / bodyAttr / package / wiring / preview /
  order）、`src/client/index.ts`（apply / dispose）、README 三件套。
- `apply(ctx)` 只写自己收回的东西；样式全部挂在
  `body[data-dsh-skin-<id>]` 下；dispose 全量收回（body 属性、注入 DOM）。
- 新增皮肤 = 新建 `skins/<id>/`，皮肤中心按 `skins/*/skin.json` 自动收录。

## 桌宠契约

- 一个桌宠 = `pets/<id>/pet.json`（id / name / modes / frames）+ `public/pet/<id>/<mode>/` 帧。
- `mode` ∈ idle / thinking / working / success / error / waiting，每个 mode 一组
  从 `00.png` 编号的帧。
- 新增桌宠 = 新建 `pets/<id>/`；状态协议 `{mode, message, updated}` 不变。

## 全局约定

- 换行 LF、编码 UTF-8（`.gitattributes` 强制）；禁 BOM、禁 CRLF。
- 禁 emoji；装饰用 `×` / `-` / `*` / `→`。
- 路径用 `node:path`，不硬编码平台分隔符。
- 提交信息 `type(scope): subject`（feat / fix / chore / docs / test / refactor）。
- 中英双语同等权威：改 README.md 必须同步 README.zh.md 并重录 README.i18n.yaml。
