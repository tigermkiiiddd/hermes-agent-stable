---
name: sprite-pipeline
description: Generate and normalize 2D sprite animations.
version: 1.0.0
author: shinobi + Hermes Agent
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [sprite, animation, 2d, pipeline, imagegen]
    category: game-development
    related_skills: [phaser-2d-game, game-ui-frontend]
---

# Sprite Pipeline Skill

这个技能用于 2D 精灵动画生成与标准化，核心目标是“整条动画一致”，不是单帧拼凑。流程围绕“已批准种子帧 -> 整条生成 -> 固定锚点归一化 -> 预览验收”。

## When to Use

- 用户要生成或修正 2D 角色动作序列
- 需要把原始条带图切分并统一尺度/锚点
- 需要产出可直接进游戏的帧序列

## Prerequisites

- 至少有一张已批准角色种子帧
- Python 环境可运行脚本
- 可用 `terminal` 执行脚本，`vision_analyze` 看输出效果

## How to Run

1. 基于种子帧构建编辑画布。
2. 一次性生成整条动画条带。
3. 归一化为固定尺寸帧并锁定锚点。
4. 生成预览图再进入引擎验收。

## Quick Reference

- 脚本目录: `../scripts/`
- 详细参考: `../references/sprite-pipeline.md`
- 构建画布: `../scripts/build_sprite_edit_canvas.py`
- 归一化条带: `../scripts/normalize_sprite_strip.py`
- 预览拼表: `../scripts/render_sprite_preview_sheet.py`

## Procedure

1. 设定不变量
   - 同角色、同朝向、同轮廓、同配色、透明背景。
2. 构建编辑画布
   - 用 `build_sprite_edit_canvas.py` 扩展种子帧上下文。
3. 生成整条条带
   - 优先单次输出完整帧数，避免逐帧漂移。
4. 归一化与锚点
   - 统一 `frame-size` 与共享 anchor（通常 bottom-center）。
   - 需要时锁回第 1 帧到原始种子帧。
5. 预览与验收
   - 输出预览图，检查节奏、体块、透明边缘与抖动。

## Pitfalls

- 逐帧独立生成导致比例和位置漂移
- 忽略统一锚点，进引擎后“抖脚”或“漂浮”
- 没做预览直接入库，回滚成本高

## Verification

- 所有帧尺寸一致，透明通道正确
- 动作在游戏缩放下可读，且关键姿态不丢失
- 预览图通过后再更新资产索引
