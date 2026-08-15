# dsh-dt-ui

[English](README.md) | 中文

dsh-dt-ui 是「陶喆」主题的 DSH Web GUI 项目：一个独立 Vite + React 预览工作台
（`src/`）+ 一组自己的 cordis 插件（`plugins/`）+ 皮肤（`skins/`）+ 桌宠
（`pets/`）+ skills（`.dsh/skills/`）。命名与包形态参照官方 dsh-web-ui，但保持
本项目自己的 `dsh-dt-*` / `@masked-knight02` 体系。命名与骨架规则见
[AGENTS.md](AGENTS.md)。

## 布局

```text
src/                         独立 Vite + React 预览工作台
plugins/dsh-dt-<feature>/    cordis 插件（host + client 半区）
skins/<skin-id>/             皮肤包（skin.json + client apply）
pets/<pet-id>/               桌宠清单（pet.json + 动画帧）
.dsh/skills/<name>/          skills
public/                      预览应用静态资产
```

## 快速开始

预览应用（无需 DSH）：

```sh
npm install
npm run dev            # http://localhost:5173
```

插件（真实 DSH 能力），逐个目录：

```sh
cd plugins/dsh-dt-pet && pnpm install && pnpm run build && cd ../..
```

注册到 dsh profile：

```sh
dsh plugin --profile web add link:$(pwd)/plugins/dsh-dt-pet
dsh --profile web
```

## 插件

| 目录 | 包名 | 作用 |
| --- | --- | --- |
| dsh-dt-status | @masked-knight02/dsh-client-ui-dt-status | 工作区 / 会话状态 |
| dsh-dt-pet | @masked-knight02/dsh-client-ui-dt-pet | 桌宠状态联动 |
| dsh-dt-git | @masked-knight02/dsh-client-ui-dt-git | Git 图谱 |
| dsh-dt-run | @masked-knight02/dsh-client-ui-dt-run | 任务执行 |
| dsh-dt-ssh | @masked-knight02/dsh-client-ui-dt-ssh | SSH 运维 |
| dsh-dt-board | @masked-knight02/dsh-client-ui-dt-board | 任务看板 |
| dsh-dt-stats | @masked-knight02/dsh-client-ui-dt-stats | 实时统计 |
| dsh-dt-remote | @masked-knight02/dsh-client-ui-dt-remote | 移动端远程 |
| dsh-dt-panel | @masked-knight02/dsh-client-ui-dt-panel | 文件 / 变更 / 预览面板 |
| dsh-dt-skins | @masked-knight02/dsh-client-ui-dt-skins | 皮肤中心 |
| dsh-dt-all | @masked-knight02/dsh-client-ui-dt-all | 聚合（装一个等于装全家桶） |

## 皮肤与桌宠

- 皮肤：一个皮肤 = `skins/<id>/` + `skin.json`；皮肤中心（`plugins/dsh-dt-skins/`）
  自动按 `skins/*/skin.json` 收录。当前收录 `dt-light` / `dt-dark` / `dt-light-deep`。新增皮肤按
  `skin-developer` skill 操作。
- 桌宠：一个桌宠 = `pets/<id>/pet.json` + `public/pet/<id>/<mode>/` 帧。当前收录
  `taozhe`。新增桌宠按 `pet-developer` skill 操作。

## 约定

UTF-8 + LF，禁 BOM/CRLF，禁 emoji，kebab-case 文件名，README 中英三件套
（`README.md` + `README.zh.md` + `README.i18n.yaml`）。完整规则见
[AGENTS.md](AGENTS.md)。
