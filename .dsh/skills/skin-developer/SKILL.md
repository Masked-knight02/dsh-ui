---
name: skin-developer
description: Build and add a new skin to the dsh-dt-ui skin collection — scaffold skins/<id>/, author skin.json plus the apply/dispose client contract, and let the skin-center plugin discover it. Use when the user asks to 新建/新增/开发一个皮肤, or to publish a skin into the skin center.
whenToUse: The user wants a new skin (新建皮肤、加个皮肤、皮肤中心加皮肤), or asks how skins are structured and shipped in dsh-dt-ui. Not for switching skins at runtime or editing the skin-center plugin itself.
---

# 皮肤开发者（dsh-dt-ui 皮肤集合）

本技能指导在 dsh-dt-ui 仓库里从零新增一个皮肤。每个皮肤是 `skins/<id>/`
下的一个自包含 client bundle，皮肤中心（`plugins/dsh-dt-skins/`）按
`skins/*/skin.json` 自动收录，无需改任何注册表文件。

## 契约速览

- 皮肤 id 用 kebab-case（如 `dt-light`）；npm 名
  `@masked-knight02/dsh-client-ui-skin-<id>`；bundle 行 id `ui-skin-<id>`。
- 一个皮肤最少包含：`skin.json`、`src/index.ts`（无操作 host 入口）、
  `src/client/index.ts`（apply/dispose）、`package.json`、`cordis.patch.yml`、
  `tsdown.config.ts`、`tsdown.prepare.config.ts`、README 三件套。
- `build/tsdown.client.ts`、`build/web-platform.ts`、`.npmrc`、`tsconfig*.json`
  从任一现有皮肤或插件复制（内容一致）。

## 1. 脚手架

```sh
cp -R skins/dt-light skins/<new-id>
cd skins/<new-id>
# 把 dt-light / ui-skin-dt-light / @masked-knight02/dsh-client-ui-skin-dt-light
# 全局替换为 new-id / ui-skin-<new-id> / @masked-knight02/dsh-client-ui-skin-<new-id>
```

## 2. 皮肤契约（硬性约束）

- 纯呈现层：不注入服务、不发 cordis 事件、不触及模型请求。
- `apply(ctx)` 只写自己收回的东西，全部写面在
  `ctx.effect(() => () => {...}, 'ui-skin-<id>: …')` 的 disposer 里收回
  （body 属性、注入的 style/DOM）。
- 样式全部挂在 `body[data-dsh-skin-<id>]` 下，不得用裸选择器污染其它皮肤。
- `skin.json` 字段：id、name、nameEn、author、tagline、description、tags、
  accent、bodyAttr（=`data-dsh-skin-<id>`）、package、wiring、preview（light/dark
  指向壁纸或预览图路径）、order（正整数，决定皮肤中心排序）。
- 静态资源放 `public/skins/`（预览应用可服务），`preview` 路径写 `/skins/<asset>`。

## 3. 构建与验证

```sh
cd skins/<new-id>
pnpm install && pnpm run build
# 期望产物：lib/index.js（host 空入口）+ lib/client.js（浏览器 bundle）
```

## 4. 验收清单

- [ ] `pnpm run build` 通过，`lib/client.js` 结构正确。
- [ ] apply 设置 body 属性与壁纸，dispose 全量收回。
- [ ] 皮肤中心面板自动列出新皮肤（重启 `dsh web` 后）。
- [ ] README 三件套已写，`README.i18n.yaml` 哈希已用 `git hash-object` 重录。
- [ ] 无 emoji、UTF-8 + LF、无 BOM/CRLF。
