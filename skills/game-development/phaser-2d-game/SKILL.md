---
name: phaser-2d-game
description: Build 2D browser games with Phaser.
version: 1.0.0
author: shinobi + Hermes Agent
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [phaser, 2d, sprites, gameplay, vite]
    category: game-development
    related_skills: [web-game-foundations, sprite-pipeline, game-ui-frontend, game-playtest]
---

# Phaser 2D Game Skill

这个技能负责 2D 浏览器游戏的主实现路径。推荐栈是 Phaser + TypeScript + Vite，并把文本密集 UI 放在 DOM 覆盖层。

## When to Use

- 用户明确要 Phaser 或 2D 浏览器游戏
- 需求包含场景管理、精灵动画、相机、玩法系统
- 需要稳健的 2D 快速落地路径

## Prerequisites

- Node.js 与包管理器可用
- 已定义核心玩法循环和输入动作集合
- 可用 `terminal` 启动 dev server，`patch` 修改代码

## How to Run

1. 拆出 simulation 与 scene 的职责边界。
2. 建立最小可玩循环（输入 -> 状态 -> 渲染反馈）。
3. 增加 HUD、动画、相机与内容资产。

## Quick Reference

- 架构参考: `../references/phaser-architecture.md`
- 资产流程: `../sprite-pipeline/SKILL.md`
- UI 指南: `../game-ui-frontend/SKILL.md`
- 常见目录: `characters/`, `environment/`, `ui/`, `fx/`, `audio/`, `data/`

## Procedure

1. 模块边界
   - `simulation/` 负责规则、回合、战斗、任务与进度。
   - `scene/` 负责渲染、相机、特效、动画播放。
2. 场景设计
   - 至少拆为 Boot/Preload、Menu、Gameplay 三层。
   - 场景尽量薄，避免在 `update()` 堆业务逻辑。
3. 输入与状态
   - 输入动作映射在单一入口维护。
   - 渲染层仅读 simulation 的状态快照。
4. UI 与表现
   - 文本密集控件用 DOM 覆盖层实现。
   - 震屏、hit-stop、视差要服务可读性而非炫技。

## Pitfalls

- 把规则直接写进 `update()` 导致不可测试
- 场景间通过可变全局对象传状态
- 资产路径写死在业务逻辑里，缺少 manifest 键

## Verification

- 场景切换和核心输入链路可稳定复现
- HUD 在不同分辨率下无关键遮挡
- 至少一次完整主循环可从开始走到失败或胜利
