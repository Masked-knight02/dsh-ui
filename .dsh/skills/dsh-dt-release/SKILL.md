---
name: dsh-dt-release
description: Release the dsh-dt-ui project — build every plugin, bump all package versions to one unified version, commit and tag, and push the tag to GitHub. Covers pre-release checks and post-release verification. Use when the user asks to 发布/发版/release/bump 版本 of dsh-dt-ui or any @masked-knight02/dsh-* package.
whenToUse: The user wants to release dsh-dt-ui (发布新版、发个版本、release、tag、push 到 GitHub), or asks how the release flow works. Not for routine commits or single-plugin development.
---

# dsh-dt-ui 发布（release）

本技能固化 dsh-dt-ui 的发版流程：全仓统一版本 → 逐个构建插件 → 提交 → 打 tag →
推送 tag 触发 GitHub。当前阶段 npm 发布未接入，发布以 GitHub tag + Release 为准。

## 仓库事实（先读）

- 仓库：Masked-knight02/dsh-ui（GitHub），本地路径即本仓库根目录。
- 包：`plugins/dsh-dt-*`（10 个功能插件）+ `skins/<id>`（皮肤）+ `pets/<id>`（桌宠清单）。
- npm scope `@masked-knight02`；`@deepseek-ai/*` SDK 依赖 `^0.1.0-rc.6`（npm `next` tag）。
- 构建链：每个插件 `pnpm install && pnpm run build`（=`tsc -b && tsdown`）。
- 禁 emoji（代码、注释、文档、提交信息、tag 均禁）。

## 0. 发版前检查（全绿才允许打 tag）

```sh
git status --short                 # 无意外文件
for p in plugins/*/; do (cd "$p" && pnpm install && pnpm run typecheck && pnpm run build); done
# 皮肤：cd skins/taozhe-light && pnpm install && pnpm run build
git log --oneline -5               # 确认包含本次全部改动
```

## 1. 版本 bump（全仓统一）

```sh
find plugins skins -name package.json -not -path '*/node_modules/*' \
  -exec sed -i '' 's/"version": "[0-9][^"]*"/"version": "X.Y.Z"/' {} +
find plugins skins -name package.json -not -path '*/node_modules/*' \
  -exec grep -H '"version"' {} \; | grep -v '"version": "X.Y.Z"'   # 必须无输出
```

## 2. 提交与 tag

```sh
git add plugins/**/package.json skins/**/package.json
git commit -m "chore(release): bump to X.Y.Z"
git tag "vX.Y.Z"
git push origin main
git push origin "vX.Y.Z"
```

## 3. 发布后验证

```sh
git ls-remote --tags origin | grep "vX.Y.Z"   # tag 已在远端
```

## 4. 纪律

- 同一版本号永不复用；补救只走「下一补丁版本」。
- 构建产物 `lib/`、`node_modules/` 不入库（`.gitignore` 已覆盖），发版只提交源码与
  package.json 版本。
- 改 README 必须同步中英两侧并重录 `README.i18n.yaml`。
