---
name: pet-developer
description: Add a new desktop pet to dsh-dt-ui — create pets/<id>/pet.json (manifest + stateMap + frame counts) and drop the animation frames under public/pet/<id>/<mode>/. Use when the user asks to 新建/新增/开发一个桌宠, or to wire a new pet into the workspace.
whenToUse: The user wants a new pet (新建桌宠、加个桌宠、换个宠物), or asks how pets are structured in dsh-dt-ui. Not for editing pet runtime state or the dsh-dt-pet plugin itself.
---

# 桌宠开发者（dsh-dt-ui 桌宠集合）

本技能指导在 dsh-dt-ui 仓库里新增一个桌宠。一个桌宠 = `pets/<id>/pet.json`
清单 + `public/pet/<id>/<mode>/` 下的编号帧；状态协议 `{mode, message, updated}`
不变。

## 契约速览

- 桌宠 id 用 kebab-case（如 `taozhe`）。
- `pet.json` 字段：`id`、`name`、`nameEn`、`description`、`stateMap`、
  `frames`（每个动画 mode → `{ "count": N }`）。
- `stateMap` 把桌宠状态 mode 映射到动画 mode：
  idle→idle、thinking→waiting、working→running、success→review、error→failed、
  waiting→waiting。
- 帧文件：`public/pet/<id>/<mode>/00.png` 起连续编号；预览应用按
  `/pet/<id>/<mode>/NN.png` 服务这些帧。

## 1. 脚手架

```sh
mkdir -p pets/<new-id>
# 复制 pets/taozhe/pet.json 作模板，改 id/name/nameEn/description 与 frames 计数
mkdir -p public/pet/<new-id>/<mode>   # 每个 mode 一个目录
# 把逐帧 PNG 按 00.png、01.png … 放进去
```

## 2. 接线

- 预览应用（`src/main.jsx`）的 `Pet` 组件当前用 `taozhe` 作默认宠物；换宠物时
  把 `/pet/taozhe/` 改成 `/pet/<new-id>/`。
- `plugins/dsh-dt-pet/` 负责读真实状态文件并按 `stateMap` 播帧，新增宠物只需
  保证 `pet.json` 与帧目录对应，无需改插件。

## 3. 验收清单

- [ ] `pets/<id>/pet.json` 的 `frames` 计数与 `public/pet/<id>/<mode>/` 实际帧数一致。
- [ ] 每个 mode 的帧从 `00.png` 连续编号。
- [ ] 预览应用能正确循环播放各 mode 动画。
- [ ] 无 emoji、UTF-8 + LF、无 BOM/CRLF。
