---
name: game-studio
description: Route browser-game work to the right implementation path.
version: 1.0.0
author: shinobi + Hermes Agent
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [game, routing, architecture, planning, browser]
    category: game-development
    related_skills: [web-game-foundations, phaser-2d-game, three-webgl-game, react-three-fiber-game, web-3d-asset-pipeline, game-ui-frontend, game-playtest, sprite-pipeline]
---

# Game Studio Skill

这是浏览器游戏任务的总入口技能，用于先分流再执行。默认路线是 2D Phaser，只有在明确需求时才切换到 Three.js、R3F 或纯资产流水线。

## When to Use

- 用户说“帮我做个游戏”但未指定技术栈
- 需求同时涉及架构、UI、资产、测试
- 需要先做实施路径选择再进入具体开发

## Prerequisites

- 已拿到最小需求：题材、核心玩法、目标平台
- 可用 `read_file`、`search_files` 看现有仓库约束
- 可用 `patch` 做后续落地改动

## How to Run

1. 先分类任务，再选执行轨道。
2. 输出单一路径方案，避免多轨混写。
3. 立即切到对应专用技能继续推进。

## Quick Reference

- 2D 默认: `../phaser-2d-game/SKILL.md`
- 3D 非 React: `../three-webgl-game/SKILL.md`
- 3D React 宿主: `../react-three-fiber-game/SKILL.md`
- 3D 资产优化: `../web-3d-asset-pipeline/SKILL.md`
- 前端 HUD/菜单: `../game-ui-frontend/SKILL.md`
- 测试与验收: `../game-playtest/SKILL.md`
- 架构基线: `../web-game-foundations/SKILL.md`
- 选型参考: `../references/engine-selection.md`

## Procedure

1. 需求分类
   - 2D 精灵/瓦片/横版/战棋：走 Phaser。
   - 3D 且非 React：走 Three.js。
   - 3D 且 React 宿主：走 R3F。
   - 主要问题是模型压缩、LOD、碰撞代理：走 3D 资产流水线。
2. 锁定核心边界
   - 明确 simulation 和 render 分离。
   - 明确 HUD 是 DOM 还是场景内 UI。
3. 输出执行计划
   - 包含目录结构、技术栈、资产策略、测试策略。
4. 进入专用技能
   - 不在本技能停留到实现细节层。

## Pitfalls

- 在未分流前就直接写代码，后续返工大
- 2D 项目硬上 3D 栈，复杂度失控
- 把资产问题当引擎问题处理，定位偏差

## Verification

- 结果必须给出唯一主路径（Phaser/Three/R3F/Asset）
- 输出中包含架构边界、UI策略、资产策略、测试策略
- 给出下一步应进入的具体技能路径
